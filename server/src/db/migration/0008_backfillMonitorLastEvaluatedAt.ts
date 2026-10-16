import mongoose from "mongoose";
import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

const JOBS_COLLECTION = "jobs";

/**
 * Backfill lastEvaluatedAt on monitors created before the lastEvaluatedAt existed.
 *
 * Stamp the upgrade moment, not 0. If set to 0, all checks will be replayed
 */
export async function backfillMonitorLastEvaluatedAt(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillMonitorLastEvaluatedAt";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		// Drop the legacy jobs collection first. The old super-simple-scheduler persisted jobs to the
		// same "jobs" collection the new db-queue uses, so any leftover rows carry an incompatible schema.
		// Migrations run before syncIndexes(), so the new Job indexes are rebuilt right after this drop.
		const db = mongoose.connection.db;
		if (db) {
			const existing = await db.listCollections({ name: JOBS_COLLECTION }).toArray();
			if (existing.length > 0) {
				await db.collection(JOBS_COLLECTION).drop();
				log.info({ collection: JOBS_COLLECTION }, "Dropped legacy collection");
			}
		}

		log.info("Starting lastEvaluatedAt backfill");

		const result = await MonitorModel.updateMany({ lastEvaluatedAt: { $exists: false } }, { $set: { lastEvaluatedAt: Date.now() } });

		log.info({ modifiedCount: result.modifiedCount }, "Backfilled lastEvaluatedAt on monitors");
	} catch (error) {
		log.error({ err: error }, "Error backfilling lastEvaluatedAt");
		throw error;
	}
}
