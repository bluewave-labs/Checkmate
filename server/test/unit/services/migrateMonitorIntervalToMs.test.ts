import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { migrateMonitorIntervalToMs } from "@/db/migration/0013_migrateMonitorIntervalToMs.js";
import { MonitorModel } from "@/domain/monitors/monitor.model.js";
import JobModel from "@/domain/jobs/job.model.js";
import { createMockLogger } from "../../helpers/createMockLogger.js";

describe("0013_migrateMonitorIntervalToMs", () => {
	let mockLogger: ReturnType<typeof createMockLogger>;

	beforeEach(() => {
		mockLogger = createMockLogger();
		jest.clearAllMocks();
	});

	it("updates monitors and check jobs having interval < 10000 or == 86400", async () => {
		const updateManyMonitorsSpy = jest.spyOn(MonitorModel, "updateMany").mockResolvedValue({
			acknowledged: true,
			matchedCount: 5,
			modifiedCount: 5,
			upsertedCount: 0,
			upsertedId: null,
		} as any);

		const updateManyJobsSpy = jest.spyOn(JobModel, "updateMany").mockResolvedValue({
			acknowledged: true,
			matchedCount: 5,
			modifiedCount: 5,
			upsertedCount: 0,
			upsertedId: null,
		} as any);

		await migrateMonitorIntervalToMs(mockLogger as any);

		expect(updateManyMonitorsSpy).toHaveBeenCalledWith(
			{
				$or: [{ interval: { $lt: 10000 } }, { interval: 86400 }],
			},
			[
				{
					$set: {
						interval: { $multiply: ["$interval", 1000] },
					},
				},
			]
		);

		expect(updateManyJobsSpy).toHaveBeenCalledWith(
			{
				type: "check",
				$or: [{ intervalMs: { $lt: 10000 } }, { intervalMs: 86400 }],
			},
			[
				{
					$set: {
						intervalMs: { $multiply: ["$intervalMs", 1000] },
					},
				},
			]
		);

		expect(mockLogger.info).toHaveBeenCalledWith(
			{ modifiedMonitors: 5, modifiedJobs: 5 },
			expect.stringContaining("Migrated 5 monitors and 5 check jobs")
		);
	});

	it("throws and logs error if updateMany fails", async () => {
		jest.spyOn(MonitorModel, "updateMany").mockRejectedValue(new Error("Database error"));

		await expect(migrateMonitorIntervalToMs(mockLogger as any)).rejects.toThrow("Database error");
		expect(mockLogger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				err: expect.any(Error),
			}),
			"Error migrating monitor intervals"
		);
	});
});
