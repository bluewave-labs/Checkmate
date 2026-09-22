import { DockerContainerAlertState, DockerContainerEvent, DockerContainerInfo } from "@/domain/docker/docker.type.js";

export const MISSING_CHECKS_BEFORE_ALERT = 2;
export const MISSING_CHECKS_BEFORE_FORGET = 20;

export interface DockerAlertConfig {
	onState: boolean;
	onHealth: boolean;
}

export interface DockerAlertEvaluation {
	next: DockerContainerAlertState[];
	events: DockerContainerEvent[];
}

const isStopped = (state: DockerContainerInfo["state"]): boolean => state === "exited" || state === "dead";

const seed = (container: DockerContainerInfo): DockerContainerAlertState => ({
	name: container.name,
	state: container.state,
	health: container.health,
	missingChecks: 0,
	alerted: false,
});

const diffContainer = (
	container: DockerContainerInfo,
	prev: DockerContainerAlertState,
	config: DockerAlertConfig,
	events: DockerContainerEvent[]
) => {
	const push = (event: Omit<DockerContainerEvent, "containerName" | "containerId">) =>
		events.push({ ...event, containerName: container.name, containerId: container.id });

	let alerted = prev.alerted;

	// Return after reported missing
	if (prev.missingChecks >= MISSING_CHECKS_BEFORE_ALERT) {
		if (config.onState) push({ kind: "returned", to: container.state });
		alerted = false;
	}

	// running -> stopped
	if (config.onState) {
		const wasStopped = isStopped(prev.state);
		const nowStopped = isStopped(container.state);
		const cleanExit = container.exitCode === 0;
		if (!wasStopped && nowStopped && !cleanExit) {
			push({ kind: "stopped", from: prev.state, to: container.status });
			alerted = true;
		} else if (wasStopped && container.state === "running" && prev.alerted) {
			push({ kind: "started", from: prev.state, to: container.state });
			alerted = false;
		}
	}
	// Health alerting
	if (config.onHealth) {
		if (prev.health !== "unhealthy" && container.health === "unhealthy") {
			push({ kind: "unhealthy", from: prev.health, to: container.health });
		} else if (prev.health === "unhealthy" && container.health === "healthy") {
			push({ kind: "healthy", from: prev.health, to: container.health });
		}
	}

	return { name: container.name, state: container.state, health: container.health, missingChecks: 0, alerted };
};

export const evaluateDockerContainers = (params: {
	containers: DockerContainerInfo[];
	previous: DockerContainerAlertState[];
	config: DockerAlertConfig;
}): DockerAlertEvaluation => {
	const { containers, previous, config } = params;
	const events: DockerContainerEvent[] = [];
	const next: DockerContainerAlertState[] = [];
	const previousByName = new Map(previous.map((state) => [state.name, state]));
	const seen = new Set<string>();

	for (const container of containers) {
		if (seen.has(container.name)) continue; // Containers cannot have same name
		seen.add(container.name);
		const prev = previousByName.get(container.name);
		next.push(prev ? diffContainer(container, prev, config, events) : seed(container));
	}

	// Remembered containers not in this list
	for (const prev of previous) {
		if (seen.has(prev.name)) continue;
		const missingChecks = prev.missingChecks + 1;
		if (missingChecks >= MISSING_CHECKS_BEFORE_FORGET) continue;
		if (config.onState && missingChecks === MISSING_CHECKS_BEFORE_ALERT) {
			events.push({ kind: "missing", containerName: prev.name, containerId: "", from: prev.state });
		}
		next.push({ ...prev, missingChecks, alerted: prev.alerted || (config.onState && missingChecks >= MISSING_CHECKS_BEFORE_ALERT) });
	}
	return { next, events };
};
