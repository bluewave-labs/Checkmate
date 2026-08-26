import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger.js";

/**
 * Backfill proxyMode on monitors created before the field existed.
 *
 * Mongoose defaults only apply to new documents, and monitorResponseSchema
 * requires proxyMode on every monitor read.
 */
export async function backfillMonitorProxyMode(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillMonitorProxyMode";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting proxyMode backfill" });

		const result = await MonitorModel.updateMany({ proxyMode: { $exists: false } }, { $set: { proxyMode: "inherit" } });

		logger.info({
			service: SERVICE_NAME,
			message: `Backfilled proxyMode on ${result.modifiedCount} monitors`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error backfilling proxyMode: ${errorMessage}` });
		throw error;
	}
}
