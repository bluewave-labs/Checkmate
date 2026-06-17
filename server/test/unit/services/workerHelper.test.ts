import { describe, expect, it, jest } from "@jest/globals";
import { WorkerHelper } from "../../../src/worker/worker.helper.ts";
import type { Monitor } from "../../../src/domain/monitors/monitor.types.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────
//
// WorkerHelper is now thin glue: it wires the scheduler's job functions to the
// CheckPipeline / GeoChecksPipeline (acquire→record→decide) and the
// ReactorDispatcher (react), and owns the cleanup jobs. The pipeline and
// dispatcher internals are tested in checkPipeline.test.ts / reactorDispatcher.test.ts;
// here we test only the glue + cleanup jobs.

const createHelper = (overrides?: Record<string, unknown>) => {
	const monitorsRepository = {
		updateById: jest.fn().mockResolvedValue({}),
		findAllMonitorIds: jest.fn().mockResolvedValue(["m1"]),
		deleteByTeamIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const jobsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const teamsRepository = {
		findAllTeamIds: jest.fn().mockResolvedValue(["team"]),
	};
	const monitorStatsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const checksRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const incidentsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const geoChecksRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const settingsService = {
		getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 30 }),
	};
	const checkService = {
		deleteOlderThan: jest.fn().mockResolvedValue(0),
	};

	const checkPipeline = { run: jest.fn().mockResolvedValue(null) };
	const geoCheckPipeline = { run: jest.fn().mockResolvedValue(null) };
	const reactorDispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };

	const defaults = {
		logger: createMockLogger(),
		checkService,
		settingsService,
		monitorsRepository,
		jobsRepository,
		teamsRepository,
		monitorStatsRepository,
		checksRepository,
		incidentsRepository,
		geoChecksRepository,
		reactorDispatcher,
		checkPipeline,
		geoCheckPipeline,
		...overrides,
	};

	const helper = new WorkerHelper(
		defaults.logger as any,
		defaults.checkService as any,
		defaults.settingsService as any,
		defaults.monitorsRepository as any,
		defaults.jobsRepository as any,
		defaults.teamsRepository as any,
		defaults.monitorStatsRepository as any,
		defaults.checksRepository as any,
		defaults.incidentsRepository as any,
		defaults.geoChecksRepository as any,
		defaults.reactorDispatcher as any,
		defaults.checkPipeline as any,
		defaults.geoCheckPipeline as any
	);
	return { helper, defaults };
};

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "m1",
		teamId: "team",
		type: "http",
		interval: 60000,
		status: "up",
		geoCheckEnabled: false,
		geoCheckLocations: [],
		...overrides,
	}) as Monitor;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("WorkerHelper", () => {
	describe("serviceName", () => {
		it("returns JobQueueHelper", () => {
			const { helper } = createHelper();
			expect(helper.serviceName).toBe("JobQueueHelper");
		});
	});

	// ── getHeartbeatJob (glue) ────────────────────────────────────────────────

	describe("getHeartbeatJob", () => {
		it("runs the pipeline and dispatches the evaluation to reactors", async () => {
			const evaluation = { monitor: { id: "m1" }, decision: {} };
			const { helper, defaults } = createHelper({ checkPipeline: { run: jest.fn().mockResolvedValue(evaluation) } });

			await helper.getHeartbeatJob()(makeMonitor());

			expect(defaults.checkPipeline.run).toHaveBeenCalled();
			expect(defaults.reactorDispatcher.dispatch).toHaveBeenCalledWith(evaluation);
		});

		it("does not dispatch when the pipeline returns null (skipped)", async () => {
			const { helper, defaults } = createHelper({ checkPipeline: { run: jest.fn().mockResolvedValue(null) } });

			await helper.getHeartbeatJob()(makeMonitor());

			expect(defaults.reactorDispatcher.dispatch).not.toHaveBeenCalled();
		});

		it("logs and rethrows when the pipeline throws", async () => {
			const { helper, defaults } = createHelper({ checkPipeline: { run: jest.fn().mockRejectedValue(new Error("boom")) } });

			await expect(helper.getHeartbeatJob()(makeMonitor())).rejects.toThrow("boom");
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "boom" }));
		});

		it("rethrows non-Error failures", async () => {
			const { helper } = createHelper({ checkPipeline: { run: jest.fn().mockRejectedValue("unexpected") } });

			await expect(helper.getHeartbeatJob()(makeMonitor())).rejects.toBe("unexpected");
		});
	});

	// ── getHeartbeatGeoJob (glue) ─────────────────────────────────────────────

	describe("getHeartbeatGeoJob", () => {
		it("runs the geo pipeline", async () => {
			const { helper, defaults } = createHelper();

			await helper.getHeartbeatGeoJob()(makeMonitor());

			expect(defaults.geoCheckPipeline.run).toHaveBeenCalled();
		});

		it("catches and logs a pipeline error without rethrowing", async () => {
			const { helper, defaults } = createHelper({ geoCheckPipeline: { run: jest.fn().mockRejectedValue(new Error("api timeout")) } });

			await expect(helper.getHeartbeatGeoJob()(makeMonitor())).resolves.toBeUndefined();
			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "api timeout" }));
		});

		it("logs 'Unknown error' for non-Error failures", async () => {
			const { helper, defaults } = createHelper({ geoCheckPipeline: { run: jest.fn().mockRejectedValue("string error") } });

			await helper.getHeartbeatGeoJob()(makeMonitor());

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getCleanupOrphanedJob ────────────────────────────────────────────────

	describe("getCleanupOrphanedJob", () => {
		it("cleans up orphaned data across all repositories", async () => {
			const { helper, defaults } = createHelper();
			(defaults.monitorsRepository.deleteByTeamIdsNotIn as jest.Mock).mockResolvedValue(2);
			(defaults.monitorStatsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(3);
			(defaults.checksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(4);
			(defaults.incidentsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(1);
			(defaults.geoChecksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(5);
			(defaults.jobsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(6);

			const job = helper.getCleanupOrphanedJob();
			await job();

			expect(defaults.teamsRepository.findAllTeamIds).toHaveBeenCalled();
			expect(defaults.monitorsRepository.deleteByTeamIdsNotIn).toHaveBeenCalledWith(["team"]);
			expect(defaults.monitorsRepository.findAllMonitorIds).toHaveBeenCalled();
			expect(defaults.monitorStatsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.checksRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.incidentsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.geoChecksRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.jobsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("2 orphaned monitors") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("3 orphaned monitor stats") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("4 orphaned checks") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("1 orphaned incidents") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("5 orphaned geo checks") }));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("6 orphaned jobs") }));
		});

		it("skips info logs when no orphaned data is found", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupOrphanedJob();
			await job();

			const infoMessages = (defaults.logger.info as jest.Mock).mock.calls.map((c: any) => c[0].message);
			expect(infoMessages).toContain("Starting cleanup of orphaned data");
			expect(infoMessages).toContain("Cleanup of orphaned data completed");
			expect(infoMessages).not.toContain(expect.stringContaining("orphaned monitors"));
		});

		it("logs warning and rethrows on error", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(new Error("db down"));
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toThrow("db down");
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "db down" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(null);
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toBeNull();
			expect(defaults.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});

	// ── getCleanupRetentionJob ───────────────────────────────────────────────

	describe("getCleanupRetentionJob", () => {
		it("deletes checks older than TTL cutoff", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Deleted") }));
		});

		it("skips cleanup when checkTTL is sentinel value (366)", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 366 }) },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).not.toHaveBeenCalled();
			expect(defaults.logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("unlimited") }));
		});

		it("logs error on failure without rethrowing", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue(new Error("db error")) },
			});
			const job = helper.getCleanupRetentionJob();

			await job(); // Should not throw

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "db error" }));
		});

		it("logs 'Unknown error' for non-Error exceptions", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue("boom") },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.logger.error).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error", stack: undefined }));
		});
	});
});
