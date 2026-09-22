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
	healthAlerted: false,
});

const diffContainer = (
	container: DockerContainerInfo,
	prev: DockerContainerAlertState,
	config: DockerAlertConfig,
	events: DockerContainerEvent[]
) => {
	const push = (event: Omit<DockerContainerEvent, "containerName" | "containerId">) =>
		events.push({ ...event, containerName: container.name, containerId: container.id });

	// An open alert is only meaningful while its switch is on; nothing can recover it once the switch is off
	let alerted = config.onState && prev.alerted;
	let healthAlerted = config.onHealth && prev.healthAlerted;

	if (config.onState) {
		// Return after reported missing
		if (alerted && prev.missingChecks >= MISSING_CHECKS_BEFORE_ALERT) {
			push({ kind: "returned", to: container.state });
			alerted = false;
		}

		const wasStopped = isStopped(prev.state);
		const nowStopped = isStopped(container.state);
		const cleanExit = container.exitCode === 0;
		if (!wasStopped && nowStopped && !cleanExit) {
			push({ kind: "stopped", from: prev.state, to: container.status });
			alerted = true;
		} else if (alerted && container.state === "running") {
			// Recovery keys off the open alert, not the previous state, so a check that observed "restarting" in between does not lose it
			push({ kind: "started", from: prev.state, to: container.state });
			alerted = false;
		}
	}

	if (config.onHealth) {
		if (prev.health !== "unhealthy" && container.health === "unhealthy") {
			push({ kind: "unhealthy", from: prev.health, to: container.health });
			healthAlerted = true;
		} else if (healthAlerted && container.health === "healthy") {
			// Same reasoning: "starting" may be observed between unhealthy and healthy
			push({ kind: "healthy", from: prev.health, to: container.health });
			healthAlerted = false;
		}
	}

	return { name: container.name, state: container.state, health: container.health, missingChecks: 0, alerted, healthAlerted };
};

// After a failed check nothing observed during the outage can be attributed, so no new alert is raised and the
// remembered state and health are replaced by what is seen now. Open alerts are kept so that they can still recover.
const reseedContainer = (
	container: DockerContainerInfo,
	prev: DockerContainerAlertState,
	config: DockerAlertConfig,
	events: DockerContainerEvent[]
) => {
	const push = (event: Omit<DockerContainerEvent, "containerName" | "containerId">) =>
		events.push({ ...event, containerName: container.name, containerId: container.id });

	let alerted = config.onState && prev.alerted;
	let healthAlerted = config.onHealth && prev.healthAlerted;

	if (alerted && prev.missingChecks >= MISSING_CHECKS_BEFORE_ALERT) {
		push({ kind: "returned", to: container.state });
		alerted = false;
	} else if (alerted && container.state === "running") {
		push({ kind: "started", from: prev.state, to: container.state });
		alerted = false;
	}
	if (healthAlerted && container.health === "healthy") {
		push({ kind: "healthy", from: prev.health, to: container.health });
		healthAlerted = false;
	}

	return { ...seed(container), alerted, healthAlerted };
};

export const evaluateDockerContainers = (params: {
	containers: DockerContainerInfo[];
	previous: DockerContainerAlertState[];
	config: DockerAlertConfig;
	reseed?: boolean;
}): DockerAlertEvaluation => {
	const { containers, previous, config, reseed = false } = params;
	const events: DockerContainerEvent[] = [];
	const next: DockerContainerAlertState[] = [];
	const previousByName = new Map(previous.map((state) => [state.name, state]));
	const seen = new Set<string>();

	for (const container of containers) {
		if (seen.has(container.name)) continue; // Containers cannot have same name
		seen.add(container.name);
		const prev = previousByName.get(container.name);
		if (!prev) next.push(seed(container));
		else next.push(reseed ? reseedContainer(container, prev, config, events) : diffContainer(container, prev, config, events));
	}

	// Remembered containers not in this list. On a reseed only those with an open alert are kept, so the alert can still recover.
	for (const prev of previous) {
		if (seen.has(prev.name)) continue;
		if (reseed && !prev.alerted && !prev.healthAlerted) continue;
		const missingChecks = prev.missingChecks + 1;
		if (missingChecks >= MISSING_CHECKS_BEFORE_FORGET) continue;
		const fireMissing = config.onState && missingChecks === MISSING_CHECKS_BEFORE_ALERT;
		if (fireMissing) {
			events.push({ kind: "missing", containerName: prev.name, containerId: "", from: prev.state });
		}
		next.push({
			...prev,
			missingChecks,
			alerted: config.onState && (prev.alerted || fireMissing),
			healthAlerted: config.onHealth && prev.healthAlerted,
		});
	}
	return { next, events };
};
