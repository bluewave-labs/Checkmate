import { describe, expect, it, jest } from "@jest/globals";
import { CheckProducer } from "../../../src/worker/worker.check-producer.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../src/types/network.ts";

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		...overrides,
	}) as Monitor;

// A maintenance window straddling "now" — active per isWindowActive.
const activeWindow = () => {
	const now = Date.now();
	return { active: true, start: new Date(now - 1000).toISOString(), end: new Date(now + 1000).toISOString(), repeat: 0 };
};

const createProducer = (overrides?: Record<string, any>) => {
	const defaults = {
		logger: createMockLogger(),
		monitorsRepository: { updateById: jest.fn().mockResolvedValue({}), findDockerTlsKeyById: jest.fn().mockResolvedValue(null) },
		maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([]) },
		checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
		networkService: { requestStatus: jest.fn().mockResolvedValue({ monitorId: "m1", status: true, code: 200, message: "OK" }) },
		proxyResolver: { resolve: jest.fn().mockResolvedValue(undefined) },
		buffer: { addToBuffer: jest.fn() },
		dockerLogsService: { buildDockerLogs: jest.fn().mockResolvedValue([]) },
		egressService: { assessAfterFailure: jest.fn().mockResolvedValue(null) },
		...overrides,
	};
	const producer = new CheckProducer(
		defaults.monitorsRepository as any,
		defaults.maintenanceWindowsRepository as any,
		defaults.checkService as any,
		defaults.networkService as any,
		defaults.proxyResolver as any,
		defaults.buffer as any,
		defaults.dockerLogsService as any,
		defaults.egressService as any,
		defaults.logger as any
	);
	return { producer, defaults };
};

describe("CheckProducer", () => {
	it("throws when monitor id is missing", async () => {
		const { producer } = createProducer();
		await expect(producer.produce({} as Monitor)).rejects.toThrow("No monitor id");
	});

	// ── maintenance gate ──────────────────────────────────────────────────────

	it("skips the check and flips status to 'maintenance' when in a maintenance window", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		const result = await producer.produce(makeMonitor({ status: "up" }));

		expect(result).toBeNull();
		expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "maintenance", statusWindow: [] });
		expect(defaults.networkService.requestStatus).not.toHaveBeenCalled();
		expect(defaults.buffer.addToBuffer).not.toHaveBeenCalled();
	});

	it("does not re-write status when already in maintenance", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([activeWindow()]) },
		});

		const result = await producer.produce(makeMonitor({ status: "maintenance" }));

		expect(result).toBeNull();
		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("moves a monitor out of maintenance explicitly once the window is over", async () => {
		const monitor = makeMonitor({ status: "maintenance" });
		const { producer, defaults } = createProducer({
			monitorsRepository: {
				updateById: jest.fn().mockResolvedValue({ ...monitor, status: "initializing" }),
				findDockerTlsKeyById: jest.fn().mockResolvedValue(null),
			},
		});

		await producer.produce(monitor);

		// The exit used to be a side effect of evaluating the resulting check, which the degraded-egress
		// short-circuit skips. Left implicit, a monitor could sit in "maintenance" for a whole egress outage.
		expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "initializing" });
		expect(defaults.networkService.requestStatus).toHaveBeenCalled();
	});

	it("does not touch the status of a monitor that was not in maintenance", async () => {
		const { producer, defaults } = createProducer();

		await producer.produce(makeMonitor({ status: "up" }));

		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("proceeds with the check when the maintenance window is inactive", async () => {
		const { producer, defaults } = createProducer({
			maintenanceWindowsRepository: { findByMonitorId: jest.fn().mockResolvedValue([{ ...activeWindow(), active: false }]) },
		});

		await producer.produce(makeMonitor());

		expect(defaults.networkService.requestStatus).toHaveBeenCalled();
	});

	// ── proxy resolution ──────────────────────────────────────────────────────

	it("passes the resolved proxy url into requestStatus", async () => {
		const { producer, defaults } = createProducer({
			proxyResolver: { resolve: jest.fn().mockResolvedValue("http://proxy.example.com:8080") },
		});
		const monitor = makeMonitor();

		await producer.produce(monitor);

		expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: "http://proxy.example.com:8080" });
	});

	it("still produces a check when the resolver returns undefined", async () => {
		const { producer, defaults } = createProducer();
		const monitor = makeMonitor();

		const result = await producer.produce(monitor);

		expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined });
		expect(result).toEqual({ status: expect.objectContaining({ monitorId: "m1" }), check: { id: "check-1" } });
	});

	// ── acquire / record ──────────────────────────────────────────────────────

	// ── docker tls key resolution ─────────────────────────────────────────────

	it("fetches the stored key for a docker monitor with a key set and passes it in the context", async () => {
		const { producer, defaults } = createProducer({
			monitorsRepository: { updateById: jest.fn(), findDockerTlsKeyById: jest.fn().mockResolvedValue("v1.abc123.iv.tag.data") },
		});
		const monitor = makeMonitor({ type: "docker", url: "tcp://host", dockerTlsKeySet: true });

		await producer.produce(monitor);

		expect(defaults.monitorsRepository.findDockerTlsKeyById).toHaveBeenCalledWith("m1");
		expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: "v1.abc123.iv.tag.data" });
	});

	it("does not fetch a key for a docker monitor without one set", async () => {
		const { producer, defaults } = createProducer();
		const monitor = makeMonitor({ type: "docker", url: "unix:///var/run/docker.sock", dockerTlsKeySet: false });

		await producer.produce(monitor);

		expect(defaults.monitorsRepository.findDockerTlsKeyById).not.toHaveBeenCalled();
		expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: undefined });
	});

	it("does not fetch a key for non-docker monitors even if the flag is set", async () => {
		const { producer, defaults } = createProducer();

		await producer.produce(makeMonitor({ type: "http", dockerTlsKeySet: true }));

		expect(defaults.monitorsRepository.findDockerTlsKeyById).not.toHaveBeenCalled();
	});

	it("passes undefined when the flag is set but the repository has no key", async () => {
		const { producer, defaults } = createProducer();
		const monitor = makeMonitor({ type: "docker", url: "tcp://host", dockerTlsKeySet: true });

		await producer.produce(monitor);

		expect(defaults.monitorsRepository.findDockerTlsKeyById).toHaveBeenCalledWith("m1");
		expect(defaults.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: undefined });
	});

	it("throws when the network response is null", async () => {
		const { producer } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(null) },
		});

		await expect(producer.produce(makeMonitor())).rejects.toThrow("No network response");
	});

	it("returns null, warns, and does not buffer when toCheck yields nothing", async () => {
		const { producer, defaults } = createProducer({
			checkService: { toCheck: jest.fn().mockReturnValue(null) },
		});

		const result = await producer.produce(makeMonitor());

		expect(result).toBeNull();
		expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No check could be built") }));
		expect(defaults.buffer.addToBuffer).not.toHaveBeenCalled();
	});

	it("buffers the built check and returns the status and check on success", async () => {
		const status = { monitorId: "m1", status: false, code: 500, message: "Error" };
		const check = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(status) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
		});

		const result = await producer.produce(makeMonitor());

		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(check);
		expect(result).toEqual({ status, check });
	});

	it("builds and buffers docker logs for a docker status", async () => {
		const status = { type: "docker", monitorId: "m1", teamId: "team", status: true, code: 200, message: "OK", payload: {} };
		const dockerLogs = [{ id: "docker-log-1" }, { id: "docker-log-2" }];
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(status) },
			buffer: { addToBuffer: jest.fn(), addDockerLogToBuffer: jest.fn() },
			dockerLogsService: { buildDockerLogs: jest.fn().mockResolvedValue(dockerLogs) },
		});

		await producer.produce(makeMonitor({ type: "docker" }));

		expect(defaults.dockerLogsService.buildDockerLogs).toHaveBeenCalledWith(status);
		expect(defaults.buffer.addDockerLogToBuffer).toHaveBeenNthCalledWith(1, dockerLogs[0]);
		expect(defaults.buffer.addDockerLogToBuffer).toHaveBeenNthCalledWith(2, dockerLogs[1]);
	});

	it("does not build docker logs for a non-docker status", async () => {
		const { producer, defaults } = createProducer();

		await producer.produce(makeMonitor());

		expect(defaults.dockerLogsService.buildDockerLogs).not.toHaveBeenCalled();
	});

	// ── egress self-check ─────────────────────────────────────────────────────

	// A transport failure: nothing came back from the target, so the code is the network-error sentinel.
	const failingStatus = { monitorId: "m1", status: false, code: NETWORK_ERROR, message: "Timeout" };

	it("does not consult the egress service for a successful check and leaves the field unset", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
		});

		await producer.produce(makeMonitor());

		expect(defaults.egressService.assessAfterFailure).not.toHaveBeenCalled();
		expect(check).not.toHaveProperty("egressStatus");
	});

	it("does not consult egress when an HTTP response was received", async () => {
		for (const status of [
			{ monitorId: "m1", status: false, code: 500, message: "Internal Server Error" },
			{ monitorId: "m1", status: false, code: 200, message: "Content mismatch" },
		]) {
			const check: Record<string, unknown> = { id: "check-1" };
			const { producer, defaults } = createProducer({
				networkService: { requestStatus: jest.fn().mockResolvedValue(status) },
				checkService: { toCheck: jest.fn().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
			});

			await producer.produce(makeMonitor());

			expect(defaults.egressService.assessAfterFailure).not.toHaveBeenCalled();
			expect(check).not.toHaveProperty("egressStatus");
			expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(check);
		}
	});

	it("consults egress for a timeout or network error", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor());

		expect(defaults.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
		expect(check.egressStatus).toBe("degraded");
	});

	it("never consults egress for a docker daemon on a local socket", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue({ ...failingStatus, type: "docker" }) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor({ type: "docker", url: "unix:///var/run/docker.sock" }));

		// Local IPC never leaves the instance, so it cannot fail through egress.
		expect(defaults.egressService.assessAfterFailure).not.toHaveBeenCalled();
		expect(check).not.toHaveProperty("egressStatus");
		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(check);
	});

	it("consults egress for a hardware check and for a docker daemon reached over TCP", async () => {
		for (const monitor of [
			makeMonitor({ type: "hardware", url: "http://capture.example.com:59232/api/v1/metrics" }),
			makeMonitor({ type: "docker", url: "tcp://docker.example.com:2376" }),
		]) {
			const check: Record<string, unknown> = { id: "check-1" };
			const { producer, defaults } = createProducer({
				networkService: { requestStatus: jest.fn().mockResolvedValue({ ...failingStatus, type: monitor.type }) },
				checkService: { toCheck: jest.fn().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
			});

			await producer.produce(monitor);

			// Both requests leave the instance, so our own loss of egress can be the cause.
			expect(defaults.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
			expect(check.egressStatus).toBe("degraded");
		}
	});

	it("does not consult egress when the provider reports that the peer answered", async () => {
		// gRPC NOT_SERVING and an authoritative DNS NXDOMAIN both carry NETWORK_ERROR, so only this flag separates
		// them from a connection failure.
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue({ ...failingStatus, peerResponded: true }) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor({ type: "dns" }));

		expect(defaults.egressService.assessAfterFailure).not.toHaveBeenCalled();
		expect(check).not.toHaveProperty("egressStatus");
	});

	it("consults egress when the provider reports that nothing answered, despite an HTTP-shaped code", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue({ ...failingStatus, code: 503, peerResponded: false }) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor({ type: "grpc" }));

		// An explicit report from the provider outranks the HTTP-status heuristic.
		expect(defaults.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
		expect(check.egressStatus).toBe("degraded");
	});

	it("flags a failing check as degraded when the egress service reports degraded egress", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		const result = await producer.produce(makeMonitor());

		expect(defaults.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
		expect(check.egressStatus).toBe("degraded");
		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(expect.objectContaining({ egressStatus: "degraded" }));
		expect(result?.check.egressStatus).toBe("degraded");
	});

	// ── status window across a spell ─────────────────────────────────────────
	// Matching the maintenance gate: cleared once as the monitor stops being evaluated, so the results either
	// side of a spell are never adjacent.

	it("clears the status window on the first degraded check of a spell", async () => {
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor({ statusWindow: [true, true, true, false, false] }));

		expect(defaults.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { statusWindow: [] });
	});

	it("does not re-write the status window for later degraded checks in the same spell", async () => {
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("degraded") },
		});

		await producer.produce(makeMonitor({ statusWindow: [] }));

		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("leaves the status window alone when the probe found egress fine", async () => {
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue({ id: "check-1" }) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("ok") },
		});

		await producer.produce(makeMonitor({ statusWindow: [true, true, true, false, false] }));

		expect(defaults.monitorsRepository.updateById).not.toHaveBeenCalled();
	});

	it("flags a failing check as ok when the probe found egress fine", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockResolvedValue("ok") },
		});

		await producer.produce(makeMonitor());

		expect(check.egressStatus).toBe("ok");
	});

	it("buffers the check when the egress assessment rejects", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
			egressService: { assessAfterFailure: jest.fn().mockRejectedValue(new Error("settings unavailable")) },
		});

		const result = await producer.produce(makeMonitor());

		expect(defaults.buffer.addToBuffer).toHaveBeenCalledWith(check);
		expect(check).not.toHaveProperty("egressStatus");
		expect(result).toEqual({ status: failingStatus, check });
		expect(defaults.logger.warn).toHaveBeenCalledWith(
			expect.objectContaining({ message: expect.stringContaining("settings unavailable"), service: "CheckProducer", method: "assessEgress" })
		);
	});

	it("leaves the field unset on a failing check when the egress check is disabled", async () => {
		const check: Record<string, unknown> = { id: "check-1" };
		const { producer, defaults } = createProducer({
			networkService: { requestStatus: jest.fn().mockResolvedValue(failingStatus) },
			checkService: { toCheck: jest.fn().mockReturnValue(check) },
		});

		await producer.produce(makeMonitor());

		expect(defaults.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
		expect(check).not.toHaveProperty("egressStatus");
	});
});
