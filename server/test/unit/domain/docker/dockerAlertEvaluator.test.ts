import { describe, expect, it } from "@jest/globals";
import {
	DockerAlertConfig,
	evaluateDockerContainers,
	MISSING_CHECKS_BEFORE_ALERT,
	MISSING_CHECKS_BEFORE_FORGET,
} from "@/domain/docker/docker-alert.evaluator.js";
import type { DockerContainerAlertState, DockerContainerInfo } from "@/domain/docker/docker.type.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeContainer = (overrides?: Partial<DockerContainerInfo>): DockerContainerInfo => ({
	id: "c1",
	name: "web",
	image: "nginx:latest",
	state: "running",
	status: "Up 3 hours",
	health: "none",
	...overrides,
});

const makeState = (overrides?: Partial<DockerContainerAlertState>): DockerContainerAlertState => ({
	name: "web",
	state: "running",
	health: "none",
	missingChecks: 0,
	alerted: false,
	healthAlerted: false,
	...overrides,
});

const config: DockerAlertConfig = { onState: true, onHealth: true };

// ── Tests ────────────────────────────────────────────────────────────────────

describe("evaluateDockerContainers", () => {
	describe("seeding", () => {
		it("seeds a first-seen container without events", () => {
			const { next, events } = evaluateDockerContainers({ containers: [makeContainer()], previous: [], config });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "running", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});

		it("seeds a stopped container silently when there is no previous state", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (137) 1 minute ago", exitCode: 137 })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [], config });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "exited", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});
	});

	describe("state events", () => {
		it("alerts when a running container exits with a non-zero code", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (137) 3 seconds ago", exitCode: 137 })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState()], config });

			expect(events).toEqual([{ kind: "stopped", containerName: "web", containerId: "c1", from: "running", to: "Exited (137) 3 seconds ago" }]);
			expect(next[0].alerted).toBe(true);
		});

		it("alerts when a running container exits with an unknown exit code", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (137) 3 seconds ago" })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState()], config });

			expect(events).toEqual([{ kind: "stopped", containerName: "web", containerId: "c1", from: "running", to: "Exited (137) 3 seconds ago" }]);
			expect(next[0].alerted).toBe(true);
		});

		it("stays silent on a clean exit and leaves alerted false", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (0) 3 seconds ago", exitCode: 0 })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState()], config });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "exited", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});

		it("counts dead as stopped", () => {
			const containers = [makeContainer({ state: "dead", status: "Dead", exitCode: 1 })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState()], config });

			expect(events).toEqual([{ kind: "stopped", containerName: "web", containerId: "c1", from: "running", to: "Dead" }]);
			expect(next[0].alerted).toBe(true);
		});

		it("fires started when alerted was true and the container is running again", () => {
			const previous = [makeState({ state: "exited", alerted: true })];

			const { next, events } = evaluateDockerContainers({ containers: [makeContainer()], previous, config });

			expect(events).toEqual([{ kind: "started", containerName: "web", containerId: "c1", from: "exited", to: "running" }]);
			expect(next[0].alerted).toBe(false);
		});

		it("fires started after a restart that was observed as restarting in between", () => {
			const restarting = evaluateDockerContainers({
				containers: [makeContainer({ state: "restarting" })],
				previous: [makeState({ state: "exited", alerted: true })],
				config,
			});
			const running = evaluateDockerContainers({ containers: [makeContainer()], previous: restarting.next, config });

			expect(restarting.events).toEqual([]);
			expect(restarting.next[0]).toMatchObject({ state: "restarting", alerted: true });
			expect(running.events).toEqual([{ kind: "started", containerName: "web", containerId: "c1", from: "restarting", to: "running" }]);
			expect(running.next[0].alerted).toBe(false);
		});

		it("does not fire started after a clean exit", () => {
			const previous = [makeState({ state: "exited", alerted: false })];

			const { next, events } = evaluateDockerContainers({ containers: [makeContainer()], previous, config });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "running", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});

		it("produces nothing for paused in either direction", () => {
			const paused = evaluateDockerContainers({
				containers: [makeContainer({ state: "paused", status: "Up 3 hours (Paused)" })],
				previous: [makeState()],
				config,
			});
			const unpaused = evaluateDockerContainers({
				containers: [makeContainer()],
				previous: [makeState({ state: "paused" })],
				config,
			});

			expect(paused.events).toEqual([]);
			expect(paused.next[0]).toMatchObject({ state: "paused", alerted: false });
			expect(unpaused.events).toEqual([]);
			expect(unpaused.next[0]).toMatchObject({ state: "running", alerted: false });
		});
	});

	describe("health events", () => {
		it("fires unhealthy from healthy", () => {
			const previous = [makeState({ health: "healthy" })];

			const { next, events } = evaluateDockerContainers({ containers: [makeContainer({ health: "unhealthy" })], previous, config });

			expect(events).toEqual([{ kind: "unhealthy", containerName: "web", containerId: "c1", from: "healthy", to: "unhealthy" }]);
			expect(next[0].health).toBe("unhealthy");
		});

		it("fires unhealthy from none", () => {
			const { next, events } = evaluateDockerContainers({ containers: [makeContainer({ health: "unhealthy" })], previous: [makeState()], config });

			expect(events).toEqual([{ kind: "unhealthy", containerName: "web", containerId: "c1", from: "none", to: "unhealthy" }]);
			expect(next[0].health).toBe("unhealthy");
		});

		it("does not fire unhealthy again while a health alert is open", () => {
			const previous = [makeState({ health: "none", healthAlerted: true })];
			const { next, events } = evaluateDockerContainers({ containers: [makeContainer({ health: "unhealthy" })], previous, config });

			expect(events).toEqual([]);
			expect(next[0].healthAlerted).toBe(true);
		});

		it("fires healthy after unhealthy", () => {
			const previous = [makeState({ health: "unhealthy", healthAlerted: true })];

			const { next, events } = evaluateDockerContainers({ containers: [makeContainer({ health: "healthy" })], previous, config });

			expect(events).toEqual([{ kind: "healthy", containerName: "web", containerId: "c1", from: "unhealthy", to: "healthy" }]);
			expect(next[0].health).toBe("healthy");
		});

		it("fires healthy after a recovery that was observed as starting in between", () => {
			const starting = evaluateDockerContainers({
				containers: [makeContainer({ health: "starting" })],
				previous: [makeState({ health: "unhealthy", healthAlerted: true })],
				config,
			});
			const healthy = evaluateDockerContainers({ containers: [makeContainer({ health: "healthy" })], previous: starting.next, config });

			expect(starting.events).toEqual([]);
			expect(starting.next[0]).toMatchObject({ health: "starting", healthAlerted: true });
			expect(healthy.events).toEqual([{ kind: "healthy", containerName: "web", containerId: "c1", from: "starting", to: "healthy" }]);
			expect(healthy.next[0].healthAlerted).toBe(false);
		});

		it("does not fire healthy for a container that was seeded unhealthy without an alert", () => {
			const { events } = evaluateDockerContainers({
				containers: [makeContainer({ health: "healthy" })],
				previous: [makeState({ health: "unhealthy" })],
				config,
			});

			expect(events).toEqual([]);
		});

		it("is silent for starting in either direction", () => {
			const intoStarting = evaluateDockerContainers({
				containers: [makeContainer({ health: "starting" })],
				previous: [makeState({ health: "healthy" })],
				config,
			});
			const outOfStarting = evaluateDockerContainers({
				containers: [makeContainer({ health: "healthy" })],
				previous: [makeState({ health: "starting" })],
				config,
			});

			expect(intoStarting.events).toEqual([]);
			expect(intoStarting.next[0].health).toBe("starting");
			expect(outOfStarting.events).toEqual([]);
			expect(outOfStarting.next[0].health).toBe("healthy");
		});
	});

	describe("missing containers", () => {
		it("fires missing on the second consecutive absence and not the first", () => {
			const first = evaluateDockerContainers({ containers: [], previous: [makeState()], config });
			const second = evaluateDockerContainers({ containers: [], previous: first.next, config });

			expect(first.events).toEqual([]);
			expect(first.next).toEqual([{ name: "web", state: "running", health: "none", missingChecks: 1, alerted: false, healthAlerted: false }]);
			expect(second.events).toEqual([{ kind: "missing", containerName: "web", containerId: "", from: "running" }]);
			expect(second.next).toEqual([
				{ name: "web", state: "running", health: "none", missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: true, healthAlerted: false },
			]);
		});

		it("does not fire missing for a container that already has an open alert, but still returns it", () => {
			const first = evaluateDockerContainers({ containers: [], previous: [makeState({ state: "exited", alerted: true })], config });
			const second = evaluateDockerContainers({ containers: [], previous: first.next, config });
			const back = evaluateDockerContainers({ containers: [makeContainer()], previous: second.next, config });

			expect(second.events).toEqual([]);
			expect(second.next[0]).toMatchObject({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: true });
			expect(back.events).toEqual([{ kind: "returned", containerName: "web", containerId: "c1", to: "running" }]);
		});

		it("fires returned when a container reported missing reappears and clears alerted", () => {
			const previous = [makeState({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: true })];

			const { next, events } = evaluateDockerContainers({ containers: [makeContainer()], previous, config });

			expect(events).toEqual([{ kind: "returned", containerName: "web", containerId: "c1", to: "running" }]);
			expect(next).toEqual([{ name: "web", state: "running", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});

		it("neither alerts nor marks a container already past the missing threshold when state alerts come on", () => {
			const absent = evaluateDockerContainers({ containers: [], previous: [makeState({ missingChecks: 5 })], config });
			const back = evaluateDockerContainers({ containers: [makeContainer()], previous: absent.next, config });

			expect(absent.events).toEqual([]);
			expect(absent.next[0]).toMatchObject({ missingChecks: 6, alerted: false });
			expect(back.events).toEqual([]);
			expect(back.next[0]).toMatchObject({ missingChecks: 0, alerted: false });
		});

		it("drops a container from next once it has been absent twenty times", () => {
			const previous = [makeState({ missingChecks: MISSING_CHECKS_BEFORE_FORGET - 1, alerted: true })];

			const { next, events } = evaluateDockerContainers({ containers: [], previous, config });

			expect(events).toEqual([]);
			expect(next).toEqual([]);
		});
	});

	describe("config switches", () => {
		const stateOff: DockerAlertConfig = { onState: false, onHealth: true };
		const healthOff: DockerAlertConfig = { onState: true, onHealth: false };

		it("suppresses stop, missing and returned when onState is false but still records state", () => {
			const stopped = evaluateDockerContainers({
				containers: [makeContainer({ state: "exited", status: "Exited (137) 3 seconds ago", exitCode: 137 })],
				previous: [makeState()],
				config: stateOff,
			});
			const missing = evaluateDockerContainers({
				containers: [],
				previous: [makeState({ missingChecks: MISSING_CHECKS_BEFORE_ALERT - 1 })],
				config: stateOff,
			});
			const returned = evaluateDockerContainers({
				containers: [makeContainer()],
				previous: [makeState({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: true })],
				config: stateOff,
			});

			const staleAlert = evaluateDockerContainers({ containers: [makeContainer()], previous: [makeState({ alerted: true })], config: stateOff });

			expect(stopped.events).toEqual([]);
			expect(stopped.next[0]).toMatchObject({ state: "exited", alerted: false });
			expect(staleAlert.events).toEqual([]);
			expect(staleAlert.next[0].alerted).toBe(false);
			expect(missing.events).toEqual([]);
			expect(missing.next[0]).toMatchObject({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: false });
			expect(returned.events).toEqual([]);
			expect(returned.next[0]).toMatchObject({ state: "running", missingChecks: 0, alerted: false, healthAlerted: false });
		});

		it("suppresses health events when onHealth is false but still records health", () => {
			const unhealthy = evaluateDockerContainers({
				containers: [makeContainer({ health: "unhealthy" })],
				previous: [makeState({ health: "healthy" })],
				config: healthOff,
			});
			const healthy = evaluateDockerContainers({
				containers: [makeContainer({ health: "healthy" })],
				previous: [makeState({ health: "unhealthy" })],
				config: healthOff,
			});

			const staleAlert = evaluateDockerContainers({
				containers: [makeContainer({ health: "unhealthy" })],
				previous: [makeState({ health: "unhealthy", healthAlerted: true })],
				config: healthOff,
			});

			expect(unhealthy.events).toEqual([]);
			expect(unhealthy.next[0]).toMatchObject({ health: "unhealthy", healthAlerted: false });
			expect(staleAlert.next[0].healthAlerted).toBe(false);
			expect(healthy.events).toEqual([]);
			expect(healthy.next[0].health).toBe("healthy");
		});
	});

	describe("reseed after a failed check", () => {
		it("raises no alert for a stop or health change observed across the outage", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (137) 3 seconds ago", exitCode: 137, health: "unhealthy" })];
			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState({ health: "healthy" })], config, reseed: true });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "exited", health: "unhealthy", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});

		it("keeps an open alert when the container is still down", () => {
			const containers = [makeContainer({ state: "exited", status: "Exited (137) 3 seconds ago", exitCode: 137, health: "unhealthy" })];
			const previous = [makeState({ state: "exited", health: "unhealthy", alerted: true, healthAlerted: true })];
			const { next, events } = evaluateDockerContainers({ containers, previous, config, reseed: true });

			expect(events).toEqual([]);
			expect(next[0]).toMatchObject({ alerted: true, healthAlerted: true });
		});

		it("recovers open alerts when the container is back up and healthy", () => {
			const previous = [makeState({ state: "exited", health: "unhealthy", alerted: true, healthAlerted: true })];
			const { next, events } = evaluateDockerContainers({ containers: [makeContainer({ health: "healthy" })], previous, config, reseed: true });

			expect(events).toEqual([
				{ kind: "started", containerName: "web", containerId: "c1", from: "exited", to: "running" },
				{ kind: "healthy", containerName: "web", containerId: "c1", from: "unhealthy", to: "healthy" },
			]);
			expect(next[0]).toMatchObject({ alerted: false, healthAlerted: false });
		});

		it("fires returned rather than started for a container that was reported missing", () => {
			const previous = [makeState({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: true })];
			const { events } = evaluateDockerContainers({ containers: [makeContainer()], previous, config, reseed: true });

			expect(events).toEqual([{ kind: "returned", containerName: "web", containerId: "c1", to: "running" }]);
		});

		it("forgets absent containers unless they have an open alert", () => {
			const previous = [makeState({ name: "quiet" }), makeState({ name: "loud", state: "exited", alerted: true })];
			const { next, events } = evaluateDockerContainers({ containers: [], previous, config, reseed: true });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "loud", state: "exited", health: "none", missingChecks: 1, alerted: true, healthAlerted: false }]);
		});

		it("never raises a missing alert on a reseed", () => {
			const previous = [makeState({ name: "sick", health: "unhealthy", healthAlerted: true, missingChecks: MISSING_CHECKS_BEFORE_ALERT - 1 })];
			const { next, events } = evaluateDockerContainers({ containers: [], previous, config, reseed: true });

			expect(events).toEqual([]);
			expect(next[0]).toMatchObject({ missingChecks: MISSING_CHECKS_BEFORE_ALERT, alerted: false, healthAlerted: true });
		});

		it("drops open alerts whose switch is off", () => {
			const previous = [makeState({ state: "exited", health: "unhealthy", alerted: true, healthAlerted: true })];
			const { next, events } = evaluateDockerContainers({
				containers: [makeContainer({ health: "healthy" })],
				previous,
				config: { onState: false, onHealth: false },
				reseed: true,
			});

			expect(events).toEqual([]);
			expect(next[0]).toMatchObject({ alerted: false, healthAlerted: false });
		});
	});

	describe("duplicate names", () => {
		it("counts a duplicate name in containers once, keeping the first occurrence", () => {
			const containers = [makeContainer(), makeContainer({ id: "c2", state: "exited", status: "Exited (137) 3 seconds ago", exitCode: 137 })];

			const { next, events } = evaluateDockerContainers({ containers, previous: [makeState()], config });

			expect(events).toEqual([]);
			expect(next).toEqual([{ name: "web", state: "running", health: "none", missingChecks: 0, alerted: false, healthAlerted: false }]);
		});
	});
});
