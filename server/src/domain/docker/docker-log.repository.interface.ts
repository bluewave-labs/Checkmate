import { DockerLog } from "@/domain/docker/docker-log.type.js";

export interface IDockerLogsRepository {
	createDockerLogs(logs: Omit<DockerLog, "id" | "createdAt" | "updatedAt">[]): Promise<number>;
	findLastLineTimestamp(monitorId: string, containerId: string): Promise<string | null>;
	findByContainerName(args: { monitorId: string; containerName: string; before?: Date; limit: number }): Promise<DockerLog[]>;
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
}
