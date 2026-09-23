import type { DockerContainerInfo } from "@/domain/docker/docker.type.js";
import type { Monitor } from "@/domain/monitors/monitor.type.js";

export const DockerAlertReasons = ["stopped", "unhealthy"] as const;
export type DockerAlertReason = (typeof DockerAlertReasons)[number];

export interface DockerContainerBreach {
	name: string;
	reason: DockerAlertReason;
	exitCode?: number;
}

export const isContainerStopped = (container: DockerContainerInfo): boolean => {
	// Container with exit code 0 is probably a one shot container don't report stopped
	return container.state === "dead" || (container.state === "exited" && container.exitCode !== 0);
};

export const isContainerUnhealthy = (container: DockerContainerInfo): boolean => {
	return container.health === "unhealthy";
};

export const findContainerBreaches = (monitor: Monitor, containers: DockerContainerInfo[]): DockerContainerBreach[] => {
	const breaches: DockerContainerBreach[] = [];
	for (const container of containers) {
		if (monitor.dockerAlertOnStopped && isContainerStopped(container)) {
			breaches.push({
				name: container.name,
				reason: "stopped",
				exitCode: container.exitCode,
			});
		} else if (monitor.dockerAlertOnUnhealthy && isContainerUnhealthy(container)) {
			breaches.push({
				name: container.name,
				reason: "unhealthy",
			});
		}
	}
	return breaches;
};

export const describeContainerBreach = (breach: DockerContainerBreach): string => {
	if (breach.reason === "unhealthy") return `${breach.name}: unhealthy`;
	if (breach.exitCode === undefined) {
		return `${breach.name}: stopped`;
	}
	return `${breach.name} stopped (exit code ${breach.exitCode})`;
};
