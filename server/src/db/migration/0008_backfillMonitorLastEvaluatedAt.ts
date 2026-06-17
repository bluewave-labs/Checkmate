import mongoose from "mongoose";
import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import { logger } from "@/utils/logger.js";

const JOBS_COLLECTION = "jobs";

/**
 * Backfill lastEvaluatedAt on monitors created before the lastEvaluatedAt existed.
 *
 * Stamp the upgrade moment, not 0. If set to 0, all checks will be replayed
 */
export async function backfillMonitorLastEvaluatedAt(): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillMonitorLastEvaluatedAt";

	try {
		// Drop the legacy jobs collection first. The old super-simple-scheduler persisted jobs to the
		// same "jobs" collection the new db-queue uses, so any leftover rows carry an incompatible schema.
		// Migrations run before syncIndexes(), so the new Job indexes are rebuilt right after this drop.
		const db = mongoose.connection.db;
		if (db) {
			const existing = await db.listCollections({ name: JOBS_COLLECTION }).toArray();
			if (existing.length > 0) {
				await db.collection(JOBS_COLLECTION).drop();
				logger.info({ service: SERVICE_NAME, message: `Dropped legacy "${JOBS_COLLECTION}" collection` });
			}
		}

		logger.info({ service: SERVICE_NAME, message: "Starting lastEvaluatedAt backfill" });

		const result = await MonitorModel.updateMany({ lastEvaluatedAt: { $exists: false } }, { $set: { lastEvaluatedAt: Date.now() } });

		logger.info({
			service: SERVICE_NAME,
			message: `Backfilled lastEvaluatedAt on ${result.modifiedCount} monitors`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error backfilling lastEvaluatedAt: ${errorMessage}` });
		throw error;
	}
}
