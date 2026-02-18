import { MonitorStatsModel } from "../models/MonitorStats.js";
import { logger } from "@/utils/logger.js";

/**
 * Cleanup duplicate MonitorStats documents
 * Keeps the most recent document (by updatedAt) for each monitorId
 * and deletes all older duplicates
 */
export async function cleanupDuplicateMonitorStats(): Promise<void> {
	const SERVICE_NAME = "Migration:CleanupDuplicateMonitorStats";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting cleanup of duplicate MonitorStats" });

		// Find all duplicate monitorIds
		const duplicates = await MonitorStatsModel.aggregate([
			{
				$group: {
					_id: "$monitorId",
					ids: { $push: "$_id" },
					updatedAts: { $push: "$updatedAt" },
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

		// For each set of duplicates, keep the newest and delete the rest
		for (const duplicate of duplicates) {
			const monitorId = duplicate._id;
			const { ids, updatedAts } = duplicate;

			type DocPair = { id: any; updatedAt: Date };

			// Create array of {id, updatedAt} pairs and sort by updatedAt descending
			const docs: DocPair[] = ids.map((id: any, index: number) => ({
				id,
				updatedAt: updatedAts[index],
			}));

			docs.sort((a: DocPair, b: DocPair) => b.updatedAt.getTime() - a.updatedAt.getTime());

			// Keep the first (newest), delete the rest
			const toDelete = docs.slice(1).map((doc: DocPair) => doc.id);

			if (toDelete.length > 0) {
				const result = await MonitorStatsModel.deleteMany({
					_id: { $in: toDelete },
				});

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
		logger.error({ service: SERVICE_NAME, message: `Error during MonitorStats cleanup: ${errorMessage}` });
		throw error;
	}
}
