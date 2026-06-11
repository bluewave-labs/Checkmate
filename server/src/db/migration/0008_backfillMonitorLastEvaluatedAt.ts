import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import { logger } from "@/utils/logger.js";

/**
 * Backfill lastEvaluatedAt on monitors created before the lastEvaluatedAt existed.
 */
export async function backfillMonitorLastEvaluatedAt(): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillMonitorLastEvaluatedAt";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting lastEvaluatedAt backfill" });

		const result = await MonitorModel.updateMany({ lastEvaluatedAt: { $exists: false } }, { $set: { lastEvaluatedAt: 0 } });

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
