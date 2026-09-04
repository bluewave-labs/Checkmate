import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import { DockerStatusPayload, MonitorStatusResponse } from "@/types/network.js";

import {
	DOCKER_LOG_TAIL_LINES,
	DockerContainerInfo,
	DockerContainerLogs,
	DockerContainerMount,
	DockerContainerPort,
	DockerContainerState,
	DockerContainerStates,
	DockerContainerSummary,
	DockerHealthStatus,
	DockerHealthStatuses,
	DockerLogLine,
	DockerLogStream,
	DockerPortProtocol,
	DockerPortProtocols,
} from "@/domain/docker/docker.type.js";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import Dockerode from "dockerode";
import { timeRequest } from "@/service/network/utils.js";
import { NETWORK_ERROR } from "@/types/network.js";
type DockerodeType = typeof Dockerode;

const SERVICE_NAME = "DockerProvider";
const STATS_CONCURRENCY = 5;
const DOCKER_LOG_MAX_LINE_BYTES = 4096;
const DOCKER_LOG_TRUNCATION_MARKER = " …[truncated]";
const DOCKER_LOG_TS_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z /;

export interface DockerError extends Error {
	statusCode?: number;
	reason?: string;
	json?: { message?: string };
}

export class DockerProvider implements IStatusProvider<DockerStatusPayload> {
	readonly type = "docker";

	constructor(
		private logger: ILogger,
		private DockerLib: DockerodeType
	) {}

	supports(type: MonitorType): boolean {
		return type === "docker";
	}

	private isDockerError(error: unknown): error is DockerError {
		return error instanceof Error && ("statusCode" in error || "reason" in error || "json" in error);
	}

	private toDockerOptions = (monitor: Monitor): Dockerode.DockerOptions => {
		const url = monitor.url?.trim();
		if (!url) throw new AppError({ message: "Docker host URL is required", status: 422, service: SERVICE_NAME, method: "toDockerOptions" });
		if (url.startsWith("unix://")) {
			const socketPath = url.slice("unix://".length);
			if (!socketPath.startsWith("/"))
				throw new AppError({ message: `Invalid Docker host URL: ${url}`, status: 422, service: SERVICE_NAME, method: "toDockerOptions" });
			return { socketPath };
		}
		if (url.startsWith("/")) return { socketPath: url };
		const match = url.match(/^ssh:\/\/(?:([^@\s]+)@)?([^\s/:@]+)(?::(\d{1,5}))?\/?$/);
		if (!match) throw new AppError({ message: `Invalid Docker host URL: ${url}`, status: 422, service: SERVICE_NAME, method: "toDockerOptions" });
		const [, username, host, port] = match;
		if (!username)
			throw new AppError({
				message: "SSH Docker host URL requires a user: ssh://user@host",
				status: 422,
				service: SERVICE_NAME,
				method: "toDockerOptions",
			});

		if (!monitor.sshPrivateKey)
			throw new AppError({
				message: "SSH Docker host requires a private key",
				status: 422,
				service: SERVICE_NAME,
				method: "toDockerOptions",
			});
		return {
			protocol: "ssh",
			host,
			port: port ? Number(port) : 22,
			username,
			sshOptions: { privateKey: monitor.sshPrivateKey },
		};
	};

	private async mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
		const results: R[] = [];
		for (let i = 0; i < items.length; i += limit) {
			results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
		}
		return results;
	}

	private toContainerState(state: string): DockerContainerState {
		return (DockerContainerStates as readonly string[]).includes(state) ? (state as DockerContainerState) : "created";
	}

	private toHealthStatus(status: string | undefined): DockerHealthStatus {
		return status && (DockerHealthStatuses as readonly string[]).includes(status) ? (status as DockerHealthStatus) : "none";
	}

	private computeCpuPct(stats: Dockerode.ContainerStats): number {
		const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
		const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage ?? 0);
		const onlineCpus = stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
		if (!(systemDelta > 0) || cpuDelta < 0) return 0;
		return (cpuDelta / systemDelta) * onlineCpus;
	}

	private computeMemory(stats: Dockerode.ContainerStats): Pick<DockerContainerInfo, "memoryUsedBytes" | "memoryLimitBytes" | "memoryPct"> {
		const raw = stats.memory_stats.usage ?? 0;
		const pageCache = stats.memory_stats.stats?.inactive_file ?? stats.memory_stats.stats?.cache ?? 0;
		const memoryUsedBytes = Math.max(0, raw - pageCache);
		const memoryLimitBytes = stats.memory_stats.limit ?? 0;
		return {
			memoryUsedBytes,
			memoryLimitBytes,
			memoryPct: memoryLimitBytes > 0 ? memoryUsedBytes / memoryLimitBytes : 0,
		};
	}

	private toContainerName = (summary: Dockerode.ContainerInfo): string => {
		return summary.Names?.[0]?.replace(/^\//, "") ?? summary.Id.slice(0, 12);
	};

	private async toContainerInfo(docker: Dockerode, summary: Dockerode.ContainerInfo): Promise<DockerContainerInfo> {
		const info: DockerContainerInfo = {
			id: summary.Id,
			name: this.toContainerName(summary),
			image: summary.Image,
			state: this.toContainerState(summary.State),
			status: summary.Status,
			health: "none",
		};

		const container = docker.getContainer(summary.Id);
		const [inspectResult, statsResult] = await Promise.allSettled([
			container.inspect(),
			summary.State === "running" ? container.stats({ stream: false }) : Promise.resolve(null),
		]);

		if (inspectResult.status === "fulfilled") {
			info.restartCount = inspectResult.value.RestartCount;
			info.startedAt = inspectResult.value.State?.StartedAt;
			info.health = this.toHealthStatus(inspectResult.value.State?.Health?.Status);
			info.ports = this.toPorts(inspectResult.value.NetworkSettings?.Ports);
			info.mounts = this.toMounts(inspectResult.value.Mounts);
		} else {
			this.logger.warn({
				message: `Failed to inspect container ${info.name}`,
				service: SERVICE_NAME,
				method: "toContainerInfo",
				details: { containerId: summary.Id },
			});
		}

		if (statsResult.status === "fulfilled" && statsResult.value) {
			info.cpuPct = this.computeCpuPct(statsResult.value);
			Object.assign(info, this.computeMemory(statsResult.value));
		}

		return info;
	}

	private toPortProtocol(protocol: string): DockerPortProtocol {
		return (DockerPortProtocols as readonly string[]).includes(protocol) ? (protocol as DockerPortProtocol) : "tcp";
	}

	private toPorts(ports: Dockerode.ContainerInspectInfo["NetworkSettings"]["Ports"] | undefined): DockerContainerPort[] {
		const result: DockerContainerPort[] = [];
		for (const [portAndProtocol, bindings] of Object.entries(ports ?? {})) {
			const [portString, protocolString = ""] = portAndProtocol.split("/");
			const privatePort = Number(portString);
			if (!Number.isInteger(privatePort)) continue;
			const protocol = this.toPortProtocol(protocolString);
			// Exposed but unpublished ports have no bindings
			if (!bindings || bindings.length === 0) {
				result.push({ privatePort, protocol });
				continue;
			}
			for (const binding of bindings) {
				const publicPort = Number(binding.HostPort);
				result.push({
					privatePort,
					protocol,
					publicPort: Number.isInteger(publicPort) ? publicPort : undefined,
					hostIp: binding.HostIp || undefined,
				});
			}
		}
		return result;
	}

	private toMounts(mounts: Dockerode.ContainerInspectInfo["Mounts"] | undefined): DockerContainerMount[] {
		return (mounts ?? []).map((mount) => ({
			type: mount.Type ?? "",
			name: mount.Name,
			source: mount.Source ?? "",
			destination: mount.Destination ?? "",
			mode: mount.Mode ?? "",
			rw: mount.RW ?? true,
		}));
	}

	// Log parsing
	private isMultiplexed(buffer: Buffer): boolean {
		return buffer.length >= 8 && buffer.readUInt8(0) <= 2 && buffer.readUInt8(1) === 0 && buffer.readUInt8(2) === 0 && buffer.readUInt8(3) === 0;
	}

	// Docker will will merge stdout and stderr if stared with `-t`.
	// Most containers will _not_ be run with `-t` though, in which case logs come in frames of [header][payload]
	private demuxLogBuffer = (buffer: Buffer): { stream: DockerLogStream; chunk: string }[] => {
		if (!this.isMultiplexed(buffer)) return [{ stream: "stdout", chunk: buffer.toString("utf8") }]; // `-t` case, log is just a string, return it
		const frames: { stream: DockerLogStream; chunk: string }[] = [];
		let offset = 0; // Start reading at the first byte of the first header
		while (offset + 8 <= buffer.length) {
			// Every 8 bytes is a header, if < 8 bytes at the end, invalid frame, stop
			const streamType = buffer.readUint8(offset); // First byte of the header is the stream type: 0 = stdin, 1 = stdout, 2 = stderr
			const payloadSize = buffer.readUint32BE(offset + 4); // Byte 4 to 7 describe how many payload bytes follow the header
			const payloadStart = offset + 8; // Advance to the payload (header 8 bytes long)
			const payloadEnd = Math.min(payloadStart + payloadSize, buffer.length); // End is the start of the payload + payload size.
			frames.push({ stream: streamType === 2 ? "stderr" : "stdout", chunk: buffer.toString("utf-8", payloadStart, payloadEnd) });
			offset = payloadEnd;
		}
		return frames;
	};

	private truncateLog = (text: string): string => {
		if (Buffer.byteLength(text, "utf8") <= DOCKER_LOG_MAX_LINE_BYTES) return text;
		const cut = Buffer.from(text, "utf8").subarray(0, DOCKER_LOG_MAX_LINE_BYTES).toString("utf8").replace(/�$/, "");
		return cut + DOCKER_LOG_TRUNCATION_MARKER;
	};

	// Docker drops trailing zeroes form timestamps. Pad out timestamps for correct string comparison
	private toLogLine(stream: DockerLogStream, raw: string): DockerLogLine | null {
		const match = raw.match(DOCKER_LOG_TS_REGEX);
		if (!match) return null; // If there's no time stamp, something is wrong with this line, drop it
		const ts = `${match[1]}.${(match[2] ?? "").padEnd(9, "0")}Z`;
		const text = raw.slice(match[0].length).replace(/\r$/, "");
		return { ts, stream, text: this.truncateLog(text) };
	}

	private parseLogBuffer = (buffer: Buffer): DockerLogLine[] => {
		const lines: DockerLogLine[] = [];
		const demuxedBuffer = this.demuxLogBuffer(buffer);
		for (const byteStream of demuxedBuffer) {
			const { stream, chunk } = byteStream;
			for (const raw of chunk.split("\n")) {
				if (raw.length === 0) continue;
				const line = this.toLogLine(stream, raw);
				if (line) lines.push(line);
			}
		}
		return lines;
	};

	private toContainerLogs = async (docker: Dockerode, summary: Dockerode.ContainerInfo): Promise<DockerContainerLogs | null> => {
		const containerName = this.toContainerName(summary);
		try {
			const buffer = await docker
				.getContainer(summary.Id)
				.logs({ follow: false, stdout: true, stderr: true, timestamps: true, tail: DOCKER_LOG_TAIL_LINES });
			return { containerId: summary.Id, containerName, lines: this.parseLogBuffer(buffer) };
		} catch (error: unknown) {
			this.logger.warn({
				message: `Failed to read logs for container ${containerName}`,
				service: SERVICE_NAME,
				method: "toContainerLogs",
				details: { containerId: summary.Id, error: error instanceof Error ? error.message : String(error) },
			});
			return null;
		}
	};

	private collectLogs = async (docker: Dockerode, summaries: Dockerode.ContainerInfo[]): Promise<DockerContainerLogs[]> => {
		const rawLogs = await this.mapWithConcurrency(summaries, STATS_CONCURRENCY, (s) => this.toContainerLogs(docker, s));
		return rawLogs.filter((log) => log !== null);
	};

	handle = async (monitor: Monitor): Promise<MonitorStatusResponse<DockerStatusPayload>> => {
		try {
			const docker = new this.DockerLib(this.toDockerOptions(monitor));
			// Host reachability is the monitor's status; ping latency is the responseTime
			const { responseTime, error } = await timeRequest(() => docker.ping());
			if (error) {
				let message = "Docker host is unreachable";
				let code = NETWORK_ERROR;
				if (this.isDockerError(error)) {
					code = error.statusCode ?? NETWORK_ERROR;
					message = error.json?.message ?? error.reason ?? error.message;
				} else if (error instanceof Error) {
					message = error.message;
				}
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code,
					message,
					responseTime,
					payload: null,
				};
			}

			const summaries = await docker.listContainers({ all: true });
			const containers = await this.mapWithConcurrency(summaries, STATS_CONCURRENCY, (s) => this.toContainerInfo(docker, s));
			const logs = monitor.dockerLogsEnabled ? await this.collectLogs(docker, summaries) : undefined;

			const summary: DockerContainerSummary = {
				total: containers.length,
				running: containers.filter((c) => c.state === "running").length,
				stopped: containers.filter((c) => c.state === "exited" || c.state === "dead").length,
				unhealthy: containers.filter((c) => c.health === "unhealthy").length,
			};
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				message: "Docker host is reachable",
				responseTime,
				payload: { containers, summary, logs },
			};
		} catch (error: unknown) {
			if (error instanceof AppError) throw error;
			throw new AppError({
				message: error instanceof Error ? error.message : "Error performing Docker request",
				service: SERVICE_NAME,
				method: "handle",
				details: {
					url: monitor.url,
				},
			});
		}
	};
}
