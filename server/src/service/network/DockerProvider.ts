import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import { DockerStatusPayload, MonitorStatusResponse } from "@/types/network.js";

import {
	DockerContainerInfo,
	DockerContainerMount,
	DockerContainerPort,
	DockerContainerState,
	DockerContainerStates,
	DockerContainerSummary,
	DockerHealthStatus,
	DockerHealthStatuses,
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

	private async toContainerInfo(docker: Dockerode, summary: Dockerode.ContainerInfo): Promise<DockerContainerInfo> {
		const info: DockerContainerInfo = {
			id: summary.Id,
			name: summary.Names?.[0]?.replace(/^\//, "") ?? summary.Id.slice(0, 12),
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
				payload: { containers, summary },
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
