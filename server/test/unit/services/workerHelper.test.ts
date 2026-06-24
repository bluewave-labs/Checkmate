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
	const settingsService = {
		getDBSettings: jest.fn().mockResolvedValue({ checkTTL: 30 }),
	};
	const checkService = {
		deleteOlderThan: jest.fn().mockResolvedValue(0),
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
		defaults.geoChecksRepository as any
	);
	return { helper, defaults };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("WorkerHelper", () => {
	describe("serviceName", () => {
		it("returns JobQueueHelper", () => {
			const { helper } = createHelper();
			expect(helper.serviceName).toBe("JobQueueHelper");
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
