import { MonitorStatsModel } from "../models/MonitorStats.js";
import { logger } from "@/utils/logger.js";

/**
 * Second-pass dedupe of MonitorStats before the unique index on monitorId is enforced.
 *
 * 0003 ran the same dedupe, but the pre-fix race in StatusService.updateRunningStats
 * could create new duplicates after 0003 completed. This migration re-runs the dedupe so
 * the unique index added in the same PR can be built without failing.
 *
 * Keeps the document with the highest totalChecks for each monitorId (most data) and
 * deletes the rest. Falls back to most recent updatedAt when totalChecks tie.
 */
export async function cleanupDuplicateMonitorStatsForUniqueIndex(): Promise<void> {
	const SERVICE_NAME = "Migration:CleanupDuplicateMonitorStatsForUniqueIndex";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting pre-unique-index dedupe of MonitorStats" });

		const duplicates = await MonitorStatsModel.aggregate([
			{
				$group: {
					_id: "$monitorId",
					docs: { $push: { id: "$_id", totalChecks: "$totalChecks", updatedAt: "$updatedAt" } },
					count: { $sum: 1 },
				},
			},
			{ $match: { count: { $gt: 1 } } },
		]);

		if (duplicates.length === 0) {
			logger.info({ service: SERVICE_NAME, message: "No duplicate MonitorStats found" });
			return;
		}

		logger.info({
			service: SERVICE_NAME,
			message: `Found ${duplicates.length} monitors with duplicate stats`,
		});

		let totalDeleted = 0;

		type DocInfo = { id: string; totalChecks: number; updatedAt: Date };

		for (const duplicate of duplicates) {
			const monitorId = duplicate._id;
			const docs: DocInfo[] = duplicate.docs;

			// Sort by totalChecks desc, then updatedAt desc — keep the winner, delete the rest.
			docs.sort((a, b) => {
				const checksDiff = (b.totalChecks ?? 0) - (a.totalChecks ?? 0);
				if (checksDiff !== 0) return checksDiff;
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			});

			const toDelete = docs.slice(1).map((doc) => doc.id);

			if (toDelete.length > 0) {
				const result = await MonitorStatsModel.deleteMany({ _id: { $in: toDelete } });
				totalDeleted += result.deletedCount ?? 0;

				logger.debug({
					service: SERVICE_NAME,
					message: `Deleted ${result.deletedCount} duplicate stats for monitor ${monitorId}`,
				});
			}
		}

		logger.info({
			service: SERVICE_NAME,
			message: `Cleanup complete. Deleted ${totalDeleted} duplicate MonitorStats documents`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error during MonitorStats dedupe: ${errorMessage}` });
		throw error;
	}
}
