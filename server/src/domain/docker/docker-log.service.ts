import { IDockerLogsRepository } from "@/domain/docker/docker-log.repository.interface.js";
import { DOCKER_LOG_RETENTION_DAYS, DockerLog } from "@/domain/docker/docker-log.type.js";
import { DOCKER_LOG_TAIL_LINES, DockerLogLine } from "@/domain/docker/docker.type.js";
import { DockerStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { ILogger } from "@/utils/logger.js";
import mongoose from "mongoose";

const SERVICE_NAME = "DockerLogsService";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface IDockerLogsService {
	buildDockerLogs(status: MonitorStatusResponse<DockerStatusPayload>): Promise<DockerLog[]>;
	createDockerLogs(logs: DockerLog[]): Promise<number>;
}

export class DockerLogsService implements IDockerLogsService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private dockerLogsRepository: IDockerLogsRepository;

	private lastTimestampByContainer = new Map<string, string>();

	constructor({ logger, dockerLogsRepository }: { logger: ILogger; dockerLogsRepository: IDockerLogsRepository }) {
		this.logger = logger;
		this.dockerLogsRepository = dockerLogsRepository;
	}

	private generateCursorKey = (monitorId: string, containerId: string) => `${monitorId}:${containerId}`;

	private getLastTimestamp = async (monitorId: string, containerId: string) => {
		const key = this.generateCursorKey(monitorId, containerId);
		const cached = this.lastTimestampByContainer.get(key);
		if (cached !== undefined) return cached || null;
		const stored = await this.dockerLogsRepository.findLastLineTimestamp(monitorId, containerId);
		this.lastTimestampByContainer.set(key, stored ?? "");
		return stored;
	};

	private newLines = (lines: DockerLogLine[], lastTimestamp: string | null): DockerLogLine[] => {
		return lastTimestamp
			? lines.filter((line) => {
					return line.ts > lastTimestamp;
				})
			: lines;
	};

	private maxTimestamp = (lines: DockerLogLine[]) => {
		return lines.reduce((max, line) => (line.ts > max ? line.ts : max), "");
	};

	buildDockerLogs = async (status: MonitorStatusResponse<DockerStatusPayload>): Promise<DockerLog[]> => {
		const payload = typeof status.payload === "object" ? status.payload : null;
		const containerLogs = payload?.logs ?? [];
		if (containerLogs.length === 0) return [];

		const now = new Date();
		const checkedAt = now.toISOString();
		const expiry = new Date(now.getTime() + DOCKER_LOG_RETENTION_DAYS * MS_PER_DAY).toISOString();
		const results: DockerLog[] = [];

		for (const dockerContainerLog of containerLogs) {
			const { containerId, containerName, lines } = dockerContainerLog;
			try {
				const lastTimestamp = await this.getLastTimestamp(status.monitorId, containerId);
				const fresh = this.newLines(lines, lastTimestamp);
				if (fresh.length === 0) continue;
				this.lastTimestampByContainer.set(this.generateCursorKey(status.monitorId, containerId), this.maxTimestamp(fresh));
				results.push({
					id: new mongoose.Types.ObjectId().toString(),
					metadata: {
						monitorId: status.monitorId,
						teamId: status.teamId,
						containerId,
						containerName,
					},
					lines: fresh,
					gap: fresh.length === DOCKER_LOG_TAIL_LINES,
					checkedAt,
					expiry,
					createdAt: checkedAt,
					updatedAt: checkedAt,
				});
			} catch (error: unknown) {
				this.logger.warn({
					message: `Failed to build docker logs for container ${containerName}`,
					service: SERVICE_NAME,
					method: "buildDockerLogs",
					details: { monitorId: status.monitorId, containerId, error: error instanceof Error ? error.message : String(error) },
				});
			}
		}
		return results;
	};

	createDockerLogs = async (logs: DockerLog[]): Promise<number> => this.dockerLogsRepository.createDockerLogs(logs);
}
