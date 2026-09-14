export const DockerContainerStates = ["created", "running", "paused", "restarting", "removing", "exited", "dead"] as const;
export type DockerContainerState = (typeof DockerContainerStates)[number];

export const DockerHealthStatuses = ["healthy", "unhealthy", "starting", "none"] as const;
export type DockerHealthStatus = (typeof DockerHealthStatuses)[number];

export const DockerPortProtocols = ["tcp", "udp", "sctp"] as const;
export type DockerPortProtocol = (typeof DockerPortProtocols)[number];

export const DockerLogStreams = ["stdout", "stderr"] as const;
export type DockerLogStream = (typeof DockerLogStreams)[number];

export const DOCKER_LOG_TAIL_LINES = 200;

export interface DockerLogLine {
	ts: string;
	stream: DockerLogStream;
	text: string;
}

export interface DockerContainerLogs {
	containerId: string;
	containerName: string;
	lines: DockerLogLine[];
}

export interface DockerContainerPort {
	privatePort: number;
	protocol: DockerPortProtocol;
	publicPort?: number;
	hostIp?: string;
}

export interface DockerContainerMount {
	type: string; // open set: bind, volume, tmpfs, image, npipe, cluster, …
	name?: string;
	source: string;
	destination: string;
	mode: string;
	rw: boolean;
}

export interface DockerContainerInfo {
	id: string;
	name: string;
	image: string;
	state: DockerContainerState;
	status: string;
	health: DockerHealthStatus;
	cpuPct?: number; // fraction of one core (docker stats convention / 100); exceeds 1 when using multiple cores
	memoryUsedBytes?: number;
	memoryLimitBytes?: number;
	memoryPct?: number; // 0-1 fraction of the memory limit
	restartCount?: number;
	startedAt?: string; // ISO date
	ports?: DockerContainerPort[];
	mounts?: DockerContainerMount[];
}

export interface DockerContainerSummary {
	total: number;
	running: number;
	stopped: number;
	unhealthy: number;
}
