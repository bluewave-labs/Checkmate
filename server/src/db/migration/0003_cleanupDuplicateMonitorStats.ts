import { MonitorStatsModel } from "../../domain/monitor-stats/monitor-stats.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

/**
 * Cleanup duplicate MonitorStats documents
 * Keeps the most recent document (by updatedAt) for each monitorId
 * and deletes all older duplicates
 */
export async function cleanupDuplicateMonitorStats(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:CleanupDuplicateMonitorStats";
	const log = logger.child({ service: SERVICE_NAME });
	try {
		log.info("Starting cleanup of duplicate MonitorStats");

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
			log.info("No duplicate MonitorStats found");
			return;
		}

		log.info(
			{
				count: duplicates.length,
			},
			"Found monitors with duplicate stats"
		);

		let totalDeleted = 0;

		// For each set of duplicates, keep the newest and delete the rest
		for (const duplicate of duplicates) {
			const monitorId = duplicate._id;
			const { ids, updatedAts } = duplicate;

			type DocPair = { id: string; updatedAt: Date };

			// Create array of {id, updatedAt} pairs and sort by updatedAt descending
			const docs: DocPair[] = ids.map((id: string, index: number) => ({
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
				log.debug({ monitorId, deletedCount: result.deletedCount }, "Deleted duplicate stats for monitor");
			}
		}

		log.info({ totalDeleted }, "Cleanup complete, deleted duplicate MonitorStats documents");
	} catch (error) {
		log.error({ err: error }, "Error during MonitorStats cleanup");
		throw error;
	}
}
