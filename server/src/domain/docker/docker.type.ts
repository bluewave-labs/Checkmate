import type { z } from "zod";
import type {
	dockerContainerInfoSchema,
	dockerContainerMountSchema,
	dockerContainerPortSchema,
	dockerContainerSummarySchema,
	dockerLogLineSchema,
} from "@/domain/docker/docker.schema.js";

export const DockerContainerStates = ["created", "running", "paused", "restarting", "removing", "exited", "dead"] as const;
export type DockerContainerState = (typeof DockerContainerStates)[number];

export const DockerHealthStatuses = ["healthy", "unhealthy", "starting", "none"] as const;
export type DockerHealthStatus = (typeof DockerHealthStatuses)[number];

export const DockerPortProtocols = ["tcp", "udp", "sctp"] as const;
export type DockerPortProtocol = (typeof DockerPortProtocols)[number];

export const DockerLogStreams = ["stdout", "stderr"] as const;
export type DockerLogStream = (typeof DockerLogStreams)[number];

export const DOCKER_LOG_TAIL_LINES = 200;
export interface DockerContainerLogs {
	containerId: string;
	containerName: string;
	lines: DockerLogLine[];
}

export type DockerLogLine = z.infer<typeof dockerLogLineSchema>;
export type DockerContainerPort = z.infer<typeof dockerContainerPortSchema>;
export type DockerContainerMount = z.infer<typeof dockerContainerMountSchema>;
export type DockerContainerInfo = z.infer<typeof dockerContainerInfoSchema>;
export type DockerContainerSummary = z.infer<typeof dockerContainerSummarySchema>;
