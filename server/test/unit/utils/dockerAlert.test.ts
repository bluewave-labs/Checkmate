import { describe, expect, it } from "@jest/globals";
import { describeContainerBreach, findContainerBreaches, isContainerStopped, isContainerUnhealthy } from "../../../src/domain/docker/docker-alert.ts";
import type { DockerContainerInfo } from "../../../src/domain/docker/docker.type.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";

const makeContainer = (overrides?: Partial<DockerContainerInfo>): DockerContainerInfo => ({
	id: "abc123",
	name: "web",
	image: "nginx:latest",
	state: "running",
	status: "Up 3 hours",
	health: "none",
	...overrides,
});

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "mon-1",
		type: "docker",
		dockerAlertOnStopped: false,
		dockerAlertOnUnhealthy: false,
		...overrides,
	}) as Monitor;

describe("isContainerStopped", () => {
	it("treats dead as stopped", () => {
		expect(isContainerStopped(makeContainer({ state: "dead" }))).toBe(true);
	});

	it.each([1, 137, 143])("treats exited with code %s as stopped", (exitCode) => {
		expect(isContainerStopped(makeContainer({ state: "exited", exitCode }))).toBe(true);
	});

	it("does not treat exited with code 0 as stopped", () => {
		expect(isContainerStopped(makeContainer({ state: "exited", exitCode: 0 }))).toBe(false);
	});

	it("treats exited with an unknown exit code as stopped", () => {
		expect(isContainerStopped(makeContainer({ state: "exited" }))).toBe(true);
	});

	it.each(["running", "restarting", "paused", "created", "removing"] as const)("does not treat %s as stopped", (state) => {
		expect(isContainerStopped(makeContainer({ state, exitCode: 1 }))).toBe(false);
	});
});

describe("isContainerUnhealthy", () => {
	it("treats unhealthy as unhealthy", () => {
		expect(isContainerUnhealthy(makeContainer({ health: "unhealthy" }))).toBe(true);
	});

	it.each(["healthy", "starting", "none"] as const)("does not treat %s as unhealthy", (health) => {
		expect(isContainerUnhealthy(makeContainer({ health }))).toBe(false);
	});
});

describe("findContainerBreaches", () => {
	const stopped = makeContainer({ name: "db", state: "exited", exitCode: 1 });
	const unhealthy = makeContainer({ name: "api", health: "unhealthy" });

	it("returns nothing when both switches are off", () => {
		expect(findContainerBreaches(makeMonitor(), [stopped, unhealthy])).toEqual([]);
	});

	it("reports only stopped containers when only the stopped switch is on", () => {
		const breaches = findContainerBreaches(makeMonitor({ dockerAlertOnStopped: true }), [stopped, unhealthy]);
		expect(breaches).toEqual([{ name: "db", reason: "stopped", exitCode: 1 }]);
	});

	it("reports only unhealthy containers when only the unhealthy switch is on", () => {
		const breaches = findContainerBreaches(makeMonitor({ dockerAlertOnUnhealthy: true }), [stopped, unhealthy]);
		expect(breaches).toEqual([{ name: "api", reason: "unhealthy" }]);
	});

	it("reports both conditions when both switches are on", () => {
		const breaches = findContainerBreaches(makeMonitor({ dockerAlertOnStopped: true, dockerAlertOnUnhealthy: true }), [stopped, unhealthy]);
		expect(breaches.map((b) => b.reason)).toEqual(["stopped", "unhealthy"]);
	});

	it("reports a container that is both stopped and unhealthy once, as stopped", () => {
		const both = makeContainer({ name: "worker", state: "dead", health: "unhealthy" });
		const breaches = findContainerBreaches(makeMonitor({ dockerAlertOnStopped: true, dockerAlertOnUnhealthy: true }), [both]);
		expect(breaches).toEqual([{ name: "worker", reason: "stopped", exitCode: undefined }]);
	});

	it("ignores healthy running containers", () => {
		const breaches = findContainerBreaches(makeMonitor({ dockerAlertOnStopped: true, dockerAlertOnUnhealthy: true }), [makeContainer()]);
		expect(breaches).toEqual([]);
	});
});

describe("describeContainerBreach", () => {
	it("describes an unhealthy container", () => {
		expect(describeContainerBreach({ name: "api", reason: "unhealthy" })).toBe("api: unhealthy");
	});

	it("describes a stopped container with its exit code", () => {
		expect(describeContainerBreach({ name: "db", reason: "stopped", exitCode: 137 })).toBe("db: stopped (exit code 137)");
	});

	it("describes a stopped container without an exit code", () => {
		expect(describeContainerBreach({ name: "db", reason: "stopped" })).toBe("db: stopped");
	});
});
