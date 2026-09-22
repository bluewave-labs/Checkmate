import { describe, expect, it, jest } from "@jest/globals";
import { WorkerPipeline } from "../../../src/worker/worker.pipeline.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.type.ts";
import type { Job } from "../../../src/domain/jobs/job.type.ts";
import type { Check } from "../../../src/domain/checks/check.type.ts";
import type { StatusChangeResult } from "../../../src/types/network.ts";
import type { DockerContainerEvent } from "../../../src/domain/docker/docker.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { NETWORK_ERROR } from "../../../src/types/network.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		...overrides,
	}) as Monitor;

const makeJob = (overrides?: Partial<Job>): Job => ({
	id: "check:m1",
	type: "check",
	refId: "m1",
	isActive: true,
	nextScheduledAt: 1000,
	intervalMs: 60000,
	lockedBy: null,
	lockedUntil: null,
	pendingChecks: [],
	runCount: 0,
	failCount: 0,
	lastFinishedAt: null,
	lastFailReason: null,
	...overrides,
});

// An evaluate row as ingest leaves it: one pending entry per stored check
const makeEvaluateJob = (...checkIds: string[]): Job =>
	makeJob({
		id: "evaluate:m1",
		type: "evaluate",
		intervalMs: null,
		pendingChecks: checkIds.map((checkId, i) => ({ checkId, createdAt: 1000 + i })),
	});

const makeCheck = (overrides?: Partial<Check>): Check =>
	({
		id: "check-1",
		metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" },
		status: true,
		statusCode: 200,
		responseTime: 100,
		message: "OK",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	}) as Check;

const makeStatusChange = (overrides: Partial<StatusChangeResult> & { status?: string }): StatusChangeResult => {
	const { status = "up", ...rest } = overrides;
	return {
		monitor: { id: "m1", status } as any,
		statusChanged: false,
		prevStatus: "up",
		code: 200,
		timestamp: 0,
		...rest,
	} as StatusChangeResult;
};

// A maintenance window straddling "now" — active per isWindowActive.
const activeWindow = () => {
	const now = Date.now();
	return { active: true, start: new Date(now - 1000).toISOString(), end: new Date(now + 1000).toISOString(), repeat: 0 };
};

const createPipeline = (overrides?: Record<string, any>) => {
	const deps = {
		logger: createMockLogger(),
		monitorsRepository: {
			findByIdLean: jest.fn<any>().mockResolvedValue(makeMonitor()),
			updateById: jest.fn<any>().mockResolvedValue({}),
			findDockerTlsKeyById: jest.fn<any>().mockResolvedValue(null),
		},
		maintenanceWindowsRepository: { findByMonitorId: jest.fn<any>().mockResolvedValue([]) },
		checksRepository: { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([]) },
		jobsRepository: {
			upsertEvaluate: jest.fn<any>().mockResolvedValue(true),
			pullEvaluated: jest.fn<any>().mockResolvedValue(true),
		},
		checkService: {
			toCheck: jest.fn<any>().mockReturnValue({ id: "check-1" }),
			toStatusResponse: jest.fn<any>().mockReturnValue({ monitorId: "m1", status: true, code: 200, message: "OK" }),
			createChecks: jest.fn<any>().mockResolvedValue([]),
		},
		networkService: { requestStatus: jest.fn<any>().mockResolvedValue({ monitorId: "m1", status: true, code: 200, message: "OK" }) },
		proxyResolver: { resolve: jest.fn<any>().mockResolvedValue(undefined) },
		bufferService: { addToBuffer: jest.fn<any>(), addDockerLogToBuffer: jest.fn<any>() },
		dockerLogsService: { buildDockerLogs: jest.fn<any>().mockResolvedValue([]) },
		egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue(null) },
		statusService: { updateMonitorStatus: jest.fn<any>().mockResolvedValue(makeStatusChange({})) },
		dispatcher: { dispatch: jest.fn<any>().mockResolvedValue(undefined) },
		...overrides,
	};
	const pipeline = new WorkerPipeline(deps as any);
	return { pipeline, deps };
};

// ── Stage 1: check job ───────────────────────────────────────────────────────

describe("WorkerPipeline", () => {
	describe("handleCheck", () => {
		it("loads the monitor by refId and produces a check for it", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.handleCheck(makeJob());

			expect(deps.monitorsRepository.findByIdLean).toHaveBeenCalledWith("m1");
			expect(deps.networkService.requestStatus).toHaveBeenCalled();
			expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith({ id: "check-1" });
		});

		it("does nothing for a job without a refId", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.handleCheck(makeJob({ refId: null }));

			expect(deps.monitorsRepository.findByIdLean).not.toHaveBeenCalled();
			expect(deps.networkService.requestStatus).not.toHaveBeenCalled();
		});

		it("does nothing when the monitor no longer exists", async () => {
			const { pipeline, deps } = createPipeline({
				monitorsRepository: { findByIdLean: jest.fn<any>().mockResolvedValue(null) },
			});

			await pipeline.handleCheck(makeJob());

			expect(deps.networkService.requestStatus).not.toHaveBeenCalled();
		});
	});

	describe("produce", () => {
		it("throws when monitor id is missing", async () => {
			const { pipeline } = createPipeline();
			await expect(pipeline.produce({} as Monitor)).rejects.toThrow("No monitor id");
		});

		// ── maintenance gate ──────────────────────────────────────────────────

		it("skips the check and flips status to 'maintenance' when in a maintenance window", async () => {
			const { pipeline, deps } = createPipeline({
				maintenanceWindowsRepository: { findByMonitorId: jest.fn<any>().mockResolvedValue([activeWindow()]) },
			});

			const result = await pipeline.produce(makeMonitor({ status: "up" }));

			expect(result).toBeNull();
			expect(deps.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "maintenance", statusWindow: [] });
			expect(deps.networkService.requestStatus).not.toHaveBeenCalled();
			expect(deps.bufferService.addToBuffer).not.toHaveBeenCalled();
		});

		it("does not re-write status when already in maintenance", async () => {
			const { pipeline, deps } = createPipeline({
				maintenanceWindowsRepository: { findByMonitorId: jest.fn<any>().mockResolvedValue([activeWindow()]) },
			});

			const result = await pipeline.produce(makeMonitor({ status: "maintenance" }));

			expect(result).toBeNull();
			expect(deps.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("moves a monitor out of maintenance explicitly once the window is over", async () => {
			const monitor = makeMonitor({ status: "maintenance" });
			const { pipeline, deps } = createPipeline({
				monitorsRepository: {
					updateById: jest.fn<any>().mockResolvedValue({ ...monitor, status: "initializing" }),
					findDockerTlsKeyById: jest.fn<any>().mockResolvedValue(null),
				},
			});

			await pipeline.produce(monitor);

			// The exit used to be a side effect of evaluating the resulting check, which the degraded-egress
			// short-circuit skips. Left implicit, a monitor could sit in "maintenance" for a whole egress outage.
			expect(deps.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { status: "initializing" });
			expect(deps.networkService.requestStatus).toHaveBeenCalled();
		});

		it("does not touch the status of a monitor that was not in maintenance", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.produce(makeMonitor({ status: "up" }));

			expect(deps.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("proceeds with the check when the maintenance window is inactive", async () => {
			const { pipeline, deps } = createPipeline({
				maintenanceWindowsRepository: { findByMonitorId: jest.fn<any>().mockResolvedValue([{ ...activeWindow(), active: false }]) },
			});

			await pipeline.produce(makeMonitor());

			expect(deps.networkService.requestStatus).toHaveBeenCalled();
		});

		// ── proxy resolution ──────────────────────────────────────────────────

		it("passes the resolved proxy url into requestStatus", async () => {
			const { pipeline, deps } = createPipeline({
				proxyResolver: { resolve: jest.fn<any>().mockResolvedValue("http://proxy.example.com:8080") },
			});
			const monitor = makeMonitor();

			await pipeline.produce(monitor);

			expect(deps.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: "http://proxy.example.com:8080" });
		});

		it("still produces a check when the resolver returns undefined", async () => {
			const { pipeline, deps } = createPipeline();
			const monitor = makeMonitor();

			const result = await pipeline.produce(monitor);

			expect(deps.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined });
			expect(result).toEqual({ status: expect.objectContaining({ monitorId: "m1" }), check: { id: "check-1" } });
		});

		// ── docker tls key resolution ─────────────────────────────────────────

		it("fetches the stored key for a docker monitor with a key set and passes it in the context", async () => {
			const { pipeline, deps } = createPipeline({
				monitorsRepository: { updateById: jest.fn<any>(), findDockerTlsKeyById: jest.fn<any>().mockResolvedValue("v1.abc123.iv.tag.data") },
			});
			const monitor = makeMonitor({ type: "docker", url: "tcp://host", dockerTlsKeySet: true });

			await pipeline.produce(monitor);

			expect(deps.monitorsRepository.findDockerTlsKeyById).toHaveBeenCalledWith("m1");
			expect(deps.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: "v1.abc123.iv.tag.data" });
		});

		it("does not fetch a key for a docker monitor without one set", async () => {
			const { pipeline, deps } = createPipeline();
			const monitor = makeMonitor({ type: "docker", url: "unix:///var/run/docker.sock", dockerTlsKeySet: false });

			await pipeline.produce(monitor);

			expect(deps.monitorsRepository.findDockerTlsKeyById).not.toHaveBeenCalled();
			expect(deps.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: undefined });
		});

		it("does not fetch a key for non-docker monitors even if the flag is set", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.produce(makeMonitor({ type: "http", dockerTlsKeySet: true }));

			expect(deps.monitorsRepository.findDockerTlsKeyById).not.toHaveBeenCalled();
		});

		it("passes undefined when the flag is set but the repository has no key", async () => {
			const { pipeline, deps } = createPipeline();
			const monitor = makeMonitor({ type: "docker", url: "tcp://host", dockerTlsKeySet: true });

			await pipeline.produce(monitor);

			expect(deps.monitorsRepository.findDockerTlsKeyById).toHaveBeenCalledWith("m1");
			expect(deps.networkService.requestStatus).toHaveBeenCalledWith(monitor, { proxyUrl: undefined, dockerTlsKey: undefined });
		});

		// ── acquire / record ──────────────────────────────────────────────────

		it("throws when the network response is null", async () => {
			const { pipeline } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(null) },
			});

			await expect(pipeline.produce(makeMonitor())).rejects.toThrow("No network response");
		});

		it("returns null, warns, and does not buffer when toCheck yields nothing", async () => {
			const { pipeline, deps } = createPipeline({
				checkService: { toCheck: jest.fn<any>().mockReturnValue(null) },
			});

			const result = await pipeline.produce(makeMonitor());

			expect(result).toBeNull();
			expect(deps.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("No check could be built") }));
			expect(deps.bufferService.addToBuffer).not.toHaveBeenCalled();
		});

		it("buffers the built check and returns the status and check on success", async () => {
			const status = { monitorId: "m1", status: false, code: 500, message: "Error" };
			const check = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(status) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
			});

			const result = await pipeline.produce(makeMonitor());

			expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith(check);
			expect(result).toEqual({ status, check });
		});

		it("builds and buffers docker logs for a docker status", async () => {
			const status = { type: "docker", monitorId: "m1", teamId: "team", status: true, code: 200, message: "OK", payload: {} };
			const dockerLogs = [{ id: "docker-log-1" }, { id: "docker-log-2" }];
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(status) },
				dockerLogsService: { buildDockerLogs: jest.fn<any>().mockResolvedValue(dockerLogs) },
			});

			await pipeline.produce(makeMonitor({ type: "docker" }));

			expect(deps.dockerLogsService.buildDockerLogs).toHaveBeenCalledWith(status);
			expect(deps.bufferService.addDockerLogToBuffer).toHaveBeenNthCalledWith(1, dockerLogs[0]);
			expect(deps.bufferService.addDockerLogToBuffer).toHaveBeenNthCalledWith(2, dockerLogs[1]);
		});

		it("does not build docker logs for a non-docker status", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.produce(makeMonitor());

			expect(deps.dockerLogsService.buildDockerLogs).not.toHaveBeenCalled();
		});

		// ── egress self-check ─────────────────────────────────────────────────

		// A transport failure: nothing came back from the target, so the code is the network-error sentinel.
		const failingStatus = { monitorId: "m1", status: false, code: NETWORK_ERROR, message: "Timeout" };

		it("does not consult the egress service for a successful check and leaves the field unset", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
			});

			await pipeline.produce(makeMonitor());

			expect(deps.egressService.assessAfterFailure).not.toHaveBeenCalled();
			expect(check).not.toHaveProperty("egressStatus");
		});

		it("does not consult egress when an HTTP response was received", async () => {
			for (const status of [
				{ monitorId: "m1", status: false, code: 500, message: "Internal Server Error" },
				{ monitorId: "m1", status: false, code: 200, message: "Content mismatch" },
			]) {
				const check: Record<string, unknown> = { id: "check-1" };
				const { pipeline, deps } = createPipeline({
					networkService: { requestStatus: jest.fn<any>().mockResolvedValue(status) },
					checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
					egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
				});

				await pipeline.produce(makeMonitor());

				expect(deps.egressService.assessAfterFailure).not.toHaveBeenCalled();
				expect(check).not.toHaveProperty("egressStatus");
				expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith(check);
			}
		});

		it("consults egress for a timeout or network error", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			await pipeline.produce(makeMonitor());

			expect(deps.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
			expect(check.egressStatus).toBe("degraded");
		});

		it("never consults egress for a docker daemon on a local socket", async () => {
			for (const url of ["unix:///var/run/docker.sock", "/var/run/docker.sock"]) {
				const check: Record<string, unknown> = { id: "check-1" };
				const { pipeline, deps } = createPipeline({
					networkService: { requestStatus: jest.fn<any>().mockResolvedValue({ ...failingStatus, type: "docker" }) },
					checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
					egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
				});

				await pipeline.produce(makeMonitor({ type: "docker", url }));

				// Local IPC never leaves the instance, so it cannot fail through egress.
				expect(deps.egressService.assessAfterFailure).not.toHaveBeenCalled();
				expect(check).not.toHaveProperty("egressStatus");
				expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith(check);
			}
		});

		it("consults egress for a hardware check and for a docker daemon reached over TCP", async () => {
			for (const monitor of [
				makeMonitor({ type: "hardware", url: "http://capture.example.com:59232/api/v1/metrics" }),
				makeMonitor({ type: "docker", url: "tcp://docker.example.com:2376" }),
			]) {
				const check: Record<string, unknown> = { id: "check-1" };
				const { pipeline, deps } = createPipeline({
					networkService: { requestStatus: jest.fn<any>().mockResolvedValue({ ...failingStatus, type: monitor.type }) },
					checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
					egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
				});

				await pipeline.produce(monitor);

				// Both requests leave the instance, so our own loss of egress can be the cause.
				expect(deps.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
				expect(check.egressStatus).toBe("degraded");
			}
		});

		it("does not consult egress when the provider reports that the peer answered", async () => {
			// gRPC NOT_SERVING and an authoritative DNS NXDOMAIN both carry NETWORK_ERROR, so only this flag separates
			// them from a connection failure.
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue({ ...failingStatus, peerResponded: true }) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			await pipeline.produce(makeMonitor({ type: "dns" }));

			expect(deps.egressService.assessAfterFailure).not.toHaveBeenCalled();
			expect(check).not.toHaveProperty("egressStatus");
		});

		it("consults egress when the provider reports that nothing answered, despite an HTTP-shaped code", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue({ ...failingStatus, code: 503, peerResponded: false }) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			await pipeline.produce(makeMonitor({ type: "grpc" }));

			// An explicit report from the provider outranks the HTTP-status heuristic.
			expect(deps.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
			expect(check.egressStatus).toBe("degraded");
		});

		it("flags a failing check as degraded when the egress service reports degraded egress", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			const result = await pipeline.produce(makeMonitor());

			expect(deps.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
			expect(check.egressStatus).toBe("degraded");
			expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith(expect.objectContaining({ egressStatus: "degraded" }));
			expect(result?.check.egressStatus).toBe("degraded");
		});

		// ── status window across a spell ─────────────────────────────────────
		// Matching the maintenance gate: cleared once as the monitor stops being evaluated, so the results either
		// side of a spell are never adjacent.

		it("clears the status window on the first degraded check of a spell", async () => {
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			await pipeline.produce(makeMonitor({ statusWindow: [true, true, true, false, false] }));

			expect(deps.monitorsRepository.updateById).toHaveBeenCalledWith("m1", "team", { statusWindow: [] });
		});

		it("does not re-write the status window for later degraded checks in the same spell", async () => {
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("degraded") },
			});

			await pipeline.produce(makeMonitor({ statusWindow: [] }));

			expect(deps.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("leaves the status window alone when the probe found egress fine", async () => {
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("ok") },
			});

			await pipeline.produce(makeMonitor({ statusWindow: [true, true, true, false, false] }));

			expect(deps.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("flags a failing check as ok when the probe found egress fine", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockResolvedValue("ok") },
			});

			await pipeline.produce(makeMonitor());

			expect(check.egressStatus).toBe("ok");
		});

		it("buffers the check when the egress assessment rejects", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
				egressService: { assessAfterFailure: jest.fn<any>().mockRejectedValue(new Error("settings unavailable")) },
			});

			const result = await pipeline.produce(makeMonitor());

			expect(deps.bufferService.addToBuffer).toHaveBeenCalledWith(check);
			expect(check).not.toHaveProperty("egressStatus");
			expect(result).toEqual({ status: failingStatus, check });
			expect(deps.logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("settings unavailable"), service: "WorkerPipeline", method: "assessEgress" })
			);
		});

		it("leaves the field unset on a failing check when the egress check is disabled", async () => {
			const check: Record<string, unknown> = { id: "check-1" };
			const { pipeline, deps } = createPipeline({
				networkService: { requestStatus: jest.fn<any>().mockResolvedValue(failingStatus) },
				checkService: { toCheck: jest.fn<any>().mockReturnValue(check) },
			});

			await pipeline.produce(makeMonitor());

			expect(deps.egressService.assessAfterFailure).toHaveBeenCalledTimes(1);
			expect(check).not.toHaveProperty("egressStatus");
		});
	});

	// ── Stage 2: ingestion ───────────────────────────────────────────────────

	describe("ingestChecks", () => {
		it("stores the batch, then arms the evaluate stage once per distinct monitor", async () => {
			const { pipeline, deps } = createPipeline();
			const batch = [
				makeCheck({ id: "c1", metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" } }),
				makeCheck({ id: "c2", metadata: { monitorId: "mon-1", teamId: "team-1", type: "http" } }),
				makeCheck({ id: "c3", metadata: { monitorId: "mon-2", teamId: "team-1", type: "http" } }),
			];

			await pipeline.ingestChecks(batch);

			const createdAt = Date.parse("2026-01-01T00:00:00.000Z");
			expect(deps.checkService.createChecks).toHaveBeenCalledWith(batch);
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenCalledTimes(2);
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenCalledWith(
				"mon-1",
				[
					{ checkId: "c1", createdAt },
					{ checkId: "c2", createdAt },
				],
				expect.any(Number)
			);
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenCalledWith("mon-2", [{ checkId: "c3", createdAt }], expect.any(Number));
		});

		it("retries a failed arm on the next ingest without re-storing the checks", async () => {
			const { pipeline, deps } = createPipeline();
			deps.jobsRepository.upsertEvaluate.mockRejectedValueOnce(new Error("arm failed"));

			await pipeline.ingestChecks([makeCheck({ id: "c1" })]);
			expect(deps.checkService.createChecks).toHaveBeenCalledTimes(1);
			expect(deps.logger.error).toHaveBeenCalledWith(expect.objectContaining({ method: "ingestChecks" }));

			await pipeline.ingestChecks([]); // nothing new, only the retry runs
			expect(deps.checkService.createChecks).toHaveBeenCalledTimes(1);
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenCalledTimes(2);
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenLastCalledWith(
				"mon-1",
				[{ checkId: "c1", createdAt: expect.any(Number) }],
				expect.any(Number)
			);

			await pipeline.ingestChecks([]); // nothing left to retry
			expect(deps.jobsRepository.upsertEvaluate).toHaveBeenCalledTimes(2);
		});

		it("neither writes nor arms for an empty batch", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.ingestChecks([]);

			expect(deps.checkService.createChecks).not.toHaveBeenCalled();
			expect(deps.jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		});

		it("does not arm the evaluate stage when the check write fails", async () => {
			const { pipeline, deps } = createPipeline();
			deps.checkService.createChecks.mockRejectedValue(new Error("DB write failed"));

			await expect(pipeline.ingestChecks([makeCheck()])).rejects.toThrow("DB write failed");

			expect(deps.jobsRepository.upsertEvaluate).not.toHaveBeenCalled();
		});
	});

	// ── Stage 3: evaluation ──────────────────────────────────────────────────

	describe("handleEvaluate", () => {
		it("loads the row's pending checks, dispatches each, and pulls its id after dispatch", async () => {
			const job = makeEvaluateJob("c1");
			const { pipeline, deps } = createPipeline({
				checksRepository: { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }]) },
			});

			await pipeline.handleEvaluate(job);

			expect(deps.checksRepository.findUnevaluatedByMonitorId).toHaveBeenCalledWith("m1", job.pendingChecks);
			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledTimes(1);
			expect(deps.dispatcher.dispatch).toHaveBeenCalledTimes(1);
			expect(deps.jobsRepository.pullEvaluated).toHaveBeenCalledWith(job.id, ["c1"]);
			// The monitor cursor is gone: nothing writes lastEvaluatedAt
			expect(deps.monitorsRepository.updateById).not.toHaveBeenCalled();
		});

		it("does nothing when the row has no pending checks", async () => {
			const { pipeline, deps } = createPipeline();

			await pipeline.handleEvaluate(makeEvaluateJob());

			expect(deps.monitorsRepository.findByIdLean).not.toHaveBeenCalled();
			expect(deps.checksRepository.findUnevaluatedByMonitorId).not.toHaveBeenCalled();
		});

		it("drops every pending id for a deleted monitor", async () => {
			const job = makeEvaluateJob("c1", "c2");
			const { pipeline, deps } = createPipeline({
				monitorsRepository: { findByIdLean: jest.fn<any>().mockResolvedValue(null) },
			});

			await pipeline.handleEvaluate(job);

			expect(deps.statusService.updateMonitorStatus).not.toHaveBeenCalled();
			expect(deps.jobsRepository.pullEvaluated).toHaveBeenCalledWith(job.id, ["c1", "c2"]);
		});

		it("stops applying checks once the lease is lost so a second claimer does not double-apply", async () => {
			const job = makeEvaluateJob("c1", "c2", "c3");
			const { pipeline, deps } = createPipeline({
				checksRepository: { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }, { id: "c2" }, { id: "c3" }]) },
				jobsRepository: {
					upsertEvaluate: jest.fn<any>(),
					pullEvaluated: jest.fn<any>().mockResolvedValueOnce(true).mockResolvedValueOnce(false), // lease lost after c2
				},
			});

			await pipeline.handleEvaluate(job);

			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledTimes(2);
			expect(deps.dispatcher.dispatch).toHaveBeenCalledTimes(2);
			expect(deps.jobsRepository.pullEvaluated).toHaveBeenCalledTimes(2); // no trailing sweep either
			expect(deps.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Lost lease") }));
		});

		it("pulls ids whose check no longer exists so they do not sit on the row forever", async () => {
			const job = makeEvaluateJob("c1", "c-gone");
			const { pipeline, deps } = createPipeline({
				checksRepository: { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }]) }, // c-gone was cleaned up
			});

			await pipeline.handleEvaluate(job);

			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledTimes(1);
			expect(deps.jobsRepository.pullEvaluated).toHaveBeenCalledWith(job.id, ["c1"]);
			expect(deps.jobsRepository.pullEvaluated).toHaveBeenCalledWith(job.id, ["c-gone"]);
		});

		it("reads the monitor once and threads the post-write monitor across the backlog", async () => {
			const job = makeEvaluateJob("c1", "c2");
			const initialMonitor = makeMonitor();
			const postWriteMonitor = makeMonitor({ status: "down" }); // what updateStatusWindowAndChecks would return after check c1
			const { pipeline, deps } = createPipeline({
				monitorsRepository: { findByIdLean: jest.fn<any>().mockResolvedValue(initialMonitor), updateById: jest.fn<any>() },
				checksRepository: { findUnevaluatedByMonitorId: jest.fn<any>().mockResolvedValue([{ id: "c1" }, { id: "c2" }]) },
				statusService: { updateMonitorStatus: jest.fn<any>().mockResolvedValue(makeStatusChange({ monitor: postWriteMonitor })) },
			});

			await pipeline.handleEvaluate(job);

			// The monitor is read once for the whole backlog, not once per check
			expect(deps.monitorsRepository.findByIdLean).toHaveBeenCalledTimes(1);
			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledTimes(2);
			// First check evaluates against the freshly-read monitor; the second against the post-write monitor from the first
			expect(deps.statusService.updateMonitorStatus.mock.calls[0][2]).toBe(initialMonitor);
			expect(deps.statusService.updateMonitorStatus.mock.calls[1][2]).toBe(postWriteMonitor);
		});
	});

	describe("evaluateCheck", () => {
		it("threads status, check, and monitor through to the status service", async () => {
			const { pipeline, deps } = createPipeline();
			const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
			const check = { id: "check-1" } as any;
			const monitor = makeMonitor({ status: "up" });

			await pipeline.evaluateCheck(status, check, monitor);

			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledWith(status, check, monitor);
		});

		it("returns an evaluation that opens an incident on a down transition", async () => {
			const status = { monitorId: "m1", status: false, code: 500, message: "Error" } as any;
			const check = { id: "check-1" } as any;
			const statusChange = makeStatusChange({ monitor: makeMonitor({ status: "down" }), statusChanged: true, prevStatus: "up", code: 500 });
			const { pipeline } = createPipeline({
				statusService: { updateMonitorStatus: jest.fn<any>().mockResolvedValue(statusChange) },
			});

			const result = await pipeline.evaluateCheck(status, check, makeMonitor());

			expect(result).toMatchObject({
				monitor: statusChange.monitor,
				status,
				check,
				statusChange,
				decision: expect.objectContaining({
					shouldCreateIncident: true,
					shouldSendNotification: true,
					incidentReason: "status_down",
				}),
			});
		});

		it("returns an evaluation that resolves an incident on recovery", async () => {
			const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
			const statusChange = makeStatusChange({ monitor: makeMonitor({ status: "up" }), statusChanged: true, prevStatus: "down" });
			const { pipeline } = createPipeline({
				statusService: { updateMonitorStatus: jest.fn<any>().mockResolvedValue(statusChange) },
			});

			const result = await pipeline.evaluateCheck(status, { id: "check-1" } as any, makeMonitor({ status: "down" }));

			expect(result.decision).toMatchObject({ shouldResolveIncident: true, shouldSendNotification: true });
		});

		it("produces a no-op decision when status did not change", async () => {
			const status = { monitorId: "m1", status: true, code: 200, message: "OK" } as any;
			const { pipeline } = createPipeline();

			const result = await pipeline.evaluateCheck(status, { id: "check-1" } as any, makeMonitor());

			expect(result.decision).toMatchObject({
				shouldCreateIncident: false,
				shouldResolveIncident: false,
				shouldSendNotification: false,
			});
		});

		// ── degraded egress ───────────────────────────────────────────────────

		it("short-circuits a check flagged with degraded egress without touching monitor status", async () => {
			const status = { monitorId: "m1", status: false, code: 500, message: "Error" } as any;
			const check = { id: "check-1", egressStatus: "degraded" } as any;
			const monitor = makeMonitor({ status: "up" });
			const { pipeline, deps } = createPipeline();

			const result = await pipeline.evaluateCheck(status, check, monitor);

			expect(deps.statusService.updateMonitorStatus).not.toHaveBeenCalled();
			expect(result.monitor).toBe(monitor);
			expect(result.statusChange).toMatchObject({ monitor, statusChanged: false, prevStatus: "up", code: 500 });
			expect(result.statusChange.timestamp).toEqual(expect.any(Number));
			expect(result.decision).toEqual({
				shouldCreateIncident: false,
				shouldResolveIncident: false,
				shouldSendNotification: false,
				incidentReason: null,
				notificationReason: null,
			});
			expect(deps.logger.debug).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("egress was degraded") }));
		});

		it("evaluates a check flagged with egress ok as normal", async () => {
			const status = { monitorId: "m1", status: false, code: 500, message: "Error" } as any;
			const check = { id: "check-1", egressStatus: "ok" } as any;
			const { pipeline, deps } = createPipeline();

			await pipeline.evaluateCheck(status, check, makeMonitor());

			expect(deps.statusService.updateMonitorStatus).toHaveBeenCalledWith(status, check, expect.anything());
		});
	});

	// The decision table, driven through evaluateCheck with the status service stubbed to return each transition.

	describe("decision", () => {
		const decide = async (statusChange: StatusChangeResult) => {
			const { pipeline } = createPipeline({
				statusService: { updateMonitorStatus: jest.fn<any>().mockResolvedValue(statusChange) },
			});
			const result = await pipeline.evaluateCheck(
				{ monitorId: "m1", status: true, code: 200, message: "OK" } as any,
				{ id: "check-1" } as any,
				makeMonitor()
			);
			return result.decision;
		};

		it("does nothing when statusChanged is false", async () => {
			const decision = await decide(makeStatusChange({ status: "down", statusChanged: false, prevStatus: "up" }));
			expect(decision).toEqual({
				shouldCreateIncident: false,
				shouldResolveIncident: false,
				shouldSendNotification: false,
				incidentReason: null,
				notificationReason: null,
			});
		});

		it("creates incident and notifies when monitor goes down", async () => {
			const decision = await decide(makeStatusChange({ status: "down", statusChanged: true, prevStatus: "up", code: 500 }));
			expect(decision).toMatchObject({
				shouldCreateIncident: true,
				shouldSendNotification: true,
				incidentReason: "status_down",
				notificationReason: "status_change",
			});
		});

		it("creates incident and notifies when monitor is breached", async () => {
			const decision = await decide(makeStatusChange({ status: "breached", statusChanged: true, prevStatus: "up" }));
			expect(decision).toMatchObject({
				shouldCreateIncident: true,
				shouldSendNotification: true,
				incidentReason: "threshold_breach",
				notificationReason: "threshold_breach",
			});
		});

		it("resolves incident when monitor recovers from down", async () => {
			const decision = await decide(makeStatusChange({ status: "up", statusChanged: true, prevStatus: "down" }));
			expect(decision).toMatchObject({
				shouldResolveIncident: true,
				shouldSendNotification: true,
				shouldCreateIncident: false,
				notificationReason: "status_change",
			});
		});

		it("resolves incident when monitor recovers from breached", async () => {
			const decision = await decide(makeStatusChange({ status: "up", statusChanged: true, prevStatus: "breached" }));
			expect(decision).toMatchObject({ shouldResolveIncident: true, shouldSendNotification: true });
		});

		it("does not create or resolve for unhandled status transitions", async () => {
			const decision = await decide(makeStatusChange({ status: "paused", statusChanged: true, prevStatus: "up" }));
			expect(decision).toMatchObject({ shouldCreateIncident: false, shouldResolveIncident: false, shouldSendNotification: false });
		});

		it("notifies on container events without a status change and opens no incident", async () => {
			const containerEvents: DockerContainerEvent[] = [
				{ kind: "stopped", containerName: "web", containerId: "abc123", from: "running", to: "Exited (137)" },
			];
			const decision = await decide(makeStatusChange({ status: "up", statusChanged: false, prevStatus: "up", containerEvents }));
			expect(decision).toEqual({
				shouldCreateIncident: false,
				shouldResolveIncident: false,
				shouldSendNotification: true,
				incidentReason: null,
				notificationReason: "container_events",
				containerEvents,
			});
		});

		it("keeps container events while a down transition sets the status change reason", async () => {
			const containerEvents: DockerContainerEvent[] = [
				{ kind: "unhealthy", containerName: "web", containerId: "abc123", from: "healthy", to: "unhealthy" },
			];
			const decision = await decide(makeStatusChange({ status: "down", statusChanged: true, prevStatus: "up", code: 500, containerEvents }));
			expect(decision).toEqual({
				shouldCreateIncident: true,
				shouldResolveIncident: false,
				shouldSendNotification: true,
				incidentReason: "status_down",
				notificationReason: "status_change",
				containerEvents,
			});
		});

		it("treats an empty container events array as no events", async () => {
			const decision = await decide(makeStatusChange({ status: "up", statusChanged: false, prevStatus: "up", containerEvents: [] }));
			expect(decision).toEqual({
				shouldCreateIncident: false,
				shouldResolveIncident: false,
				shouldSendNotification: false,
				incidentReason: null,
				notificationReason: null,
			});
		});
	});
});
