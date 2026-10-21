import { describe, expect, it, jest } from "@jest/globals";
import { WorkerHelper } from "../../../src/worker/worker.helper.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────
//
// WorkerHelper is now thin glue: it wires the geo job to the GeoChecksPipeline and
// owns the cleanup jobs. The pipeline internals are tested in checkPipeline.test.ts;
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
	const dockerLogsRepository = {
		deleteByMonitorIdsNotIn: jest.fn().mockResolvedValue(0),
	};
	const settingsService = {
		getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 30 }),
	};
	const checkService = {
		deleteOlderThan: jest.fn().mockResolvedValue(0),
	};
	const telemetryService = {
		handleJob: jest.fn().mockResolvedValue(undefined),
	};

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
		dockerLogsRepository,
		telemetryService,
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
		defaults.dockerLogsRepository as any,
		defaults.telemetryService as any
	);
	return { helper, defaults };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("WorkerHelper", () => {
	// ── getCleanupOrphanedJob ────────────────────────────────────────────────

	describe("getCleanupOrphanedJob", () => {
		it("cleans up orphaned data across all repositories", async () => {
			const { helper, defaults } = createHelper();
			(defaults.monitorsRepository.deleteByTeamIdsNotIn as jest.Mock).mockResolvedValue(2);
			(defaults.monitorStatsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(3);
			(defaults.checksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(4);
			(defaults.incidentsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(1);
			(defaults.geoChecksRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(5);
			(defaults.dockerLogsRepository.deleteByMonitorIdsNotIn as jest.Mock).mockResolvedValue(7);
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
			expect(defaults.dockerLogsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.jobsRepository.deleteByMonitorIdsNotIn).toHaveBeenCalledWith(["m1"]);
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 2 }, "Deleted orphaned monitors");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 3 }, "Deleted orphaned monitor stats");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 4 }, "Deleted orphaned checks");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 1 }, "Deleted orphaned incidents");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 5 }, "Deleted orphaned geo checks");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 7 }, "Deleted orphaned docker logs");
			expect(defaults.logger.info).toHaveBeenCalledWith({ count: 6 }, "Deleted orphaned jobs");
		});

		it("skips info logs when no orphaned data is found", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupOrphanedJob();
			await job();

			// (message) or (fields, message): the message is whichever argument is the string
			const infoMessages = (defaults.logger.info as jest.Mock).mock.calls.map((c: any) => (typeof c[0] === "string" ? c[0] : c[1]));
			expect(infoMessages).toEqual(["Starting cleanup of orphaned data", "Cleanup of orphaned data completed"]);
		});

		it("logs warning and rethrows on error", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(new Error("db down"));
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toThrow("db down");
			expect(defaults.logger.warn).toHaveBeenCalledWith({ err: new Error("db down") }, "Cleanup of orphaned data failed");
		});

		it("logs a non-Error thrown value under err", async () => {
			const { helper, defaults } = createHelper();
			(defaults.teamsRepository.findAllTeamIds as jest.Mock).mockRejectedValue(null);
			const job = helper.getCleanupOrphanedJob();

			await expect(job()).rejects.toBeNull();
			expect(defaults.logger.warn).toHaveBeenCalledWith({ err: null }, "Cleanup of orphaned data failed");
		});
	});

	// ── getCleanupRetentionJob ───────────────────────────────────────────────

	describe("getCleanupRetentionJob", () => {
		it("deletes checks older than TTL cutoff", async () => {
			const { helper, defaults } = createHelper();
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).toHaveBeenCalledWith(expect.any(Date));
			expect(defaults.logger.info).toHaveBeenCalledWith(
				expect.objectContaining({ count: expect.any(Number), cutoff: expect.any(String) }),
				"Deleted checks older than the retention cutoff"
			);
		});

		it("skips cleanup when checkTTL is sentinel value (366)", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 366 }) },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.checkService.deleteOlderThan).not.toHaveBeenCalled();
			expect(defaults.logger.info).toHaveBeenCalledWith("Check TTL is set to unlimited, skipping cleanup");
		});

		it("logs error on failure without rethrowing", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue(new Error("db error")) },
			});
			const job = helper.getCleanupRetentionJob();

			await job(); // Should not throw

			expect(defaults.logger.error).toHaveBeenCalledWith({ err: new Error("db error") }, "Retention cleanup failed");
		});

		it("logs a non-Error thrown value under err", async () => {
			const { helper, defaults } = createHelper({
				settingsService: { getDBSettings: jest.fn().mockRejectedValue("boom") },
			});
			const job = helper.getCleanupRetentionJob();
			await job();

			expect(defaults.logger.error).toHaveBeenCalledWith({ err: "boom" }, "Retention cleanup failed");
		});
	});

	describe("getTelemetryJob", () => {
		it("returns a function that runs the telemetry heartbeat", async () => {
			const { helper, defaults } = createHelper();

			await helper.getTelemetryJob()();

			expect(defaults.telemetryService.handleJob).toHaveBeenCalledTimes(1);
		});
	});
});
