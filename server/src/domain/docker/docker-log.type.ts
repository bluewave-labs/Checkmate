import { DockerLogLine } from "@/domain/docker/docker.type.js";

export const DOCKER_LOG_RETENTION_DAYS = 7;
export const DOCKER_LOG_PAGE_DEFAULT = 20;
export const DOCKER_LOG_PAGE_MAX = 50;

export interface DockerLogMetadata {
	monitorId: string;
	teamId: string;
	containerId: string;
	containerName: string;
}

export interface DockerLog {
	id: string;
	metadata: DockerLogMetadata;
	lines: DockerLogLine[];
	gap: boolean;
	checkedAt: string;
	expiry: string;
	createdAt: string;
	updatedAt: string;
}

export interface DockerLogPage {
	logs: DockerLog[];
	nextCursor: string | null;
}
