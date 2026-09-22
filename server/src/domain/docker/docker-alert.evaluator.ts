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
	events: DockerContainerEvent[],
	reseed: boolean
) => {
	const push = (event: Omit<DockerContainerEvent, "containerName" | "containerId">) =>
		events.push({ ...event, containerName: container.name, containerId: container.id });

	// An open alert is only meaningful while its switch is on; nothing can recover it once the switch is off.
	// On a reseed (first check after a failed one) nothing observed across the outage can be attributed, so no new
	// alert is raised; open alerts are kept so that they can still recover.
	let alerted = config.onState && prev.alerted;
	let healthAlerted = config.onHealth && prev.healthAlerted;

	if (config.onState) {
		if (alerted && prev.missingChecks >= MISSING_CHECKS_BEFORE_ALERT) {
			push({ kind: "returned", to: container.state });
			alerted = false;
		}

		const wasStopped = isStopped(prev.state);
		const nowStopped = isStopped(container.state);
		const cleanExit = container.exitCode === 0;
		if (!reseed && !wasStopped && nowStopped && !cleanExit) {
			push({ kind: "stopped", from: prev.state, to: container.status });
			alerted = true;
		} else if (alerted && container.state === "running") {
			// Recovery keys off the open alert, not the previous state, so a check that observed "restarting" in between does not lose it
			push({ kind: "started", from: prev.state, to: container.state });
			alerted = false;
		}
	}

	if (config.onHealth) {
		// Both a transition and no open alert: the transition keeps a container seeded or reseeded as unhealthy silent,
		// the open alert stops a restart reading "starting" between two unhealthy observations from alerting twice
		if (!reseed && !healthAlerted && prev.health !== "unhealthy" && container.health === "unhealthy") {
			push({ kind: "unhealthy", from: prev.health, to: container.health });
			healthAlerted = true;
		} else if (healthAlerted && (container.health === "healthy" || container.health === "none")) {
			// "none" means the health check was removed; the alert cannot stay open for a check that no longer exists
			push({ kind: "healthy", from: prev.health, to: container.health });
			healthAlerted = false;
		}
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
		next.push(prev ? diffContainer(container, prev, config, events, reseed) : seed(container));
	}

	// Remembered containers not in this list. On a reseed only those with an open alert are kept, so the alert can still recover.
	for (const prev of previous) {
		if (seen.has(prev.name)) continue;
		if (reseed && !prev.alerted && !prev.healthAlerted) continue;
		const missingChecks = prev.missingChecks + 1;
		if (missingChecks >= MISSING_CHECKS_BEFORE_FORGET) continue;
		// Fires once, on the first eligible check at or past the threshold, so a switch that was off or a reseed at the
		// exact threshold does not lose it. A container that already has an open alert is not alerted again for disappearing.
		const fireMissing = config.onState && !reseed && !prev.alerted && missingChecks >= MISSING_CHECKS_BEFORE_ALERT;
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
