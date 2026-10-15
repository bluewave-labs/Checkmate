import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

/**
 * Backfill proxyMode on monitors created before the field existed.
 *
 * Mongoose defaults only apply to new documents, and monitorResponseSchema
 * requires proxyMode on every monitor read.
 */
export async function backfillMonitorProxyMode(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillMonitorProxyMode";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting proxyMode backfill");

		const result = await MonitorModel.updateMany({ proxyMode: { $exists: false } }, { $set: { proxyMode: "inherit" } });

		log.info({ modifiedCount: result.modifiedCount }, "Backfilled proxyMode on monitors");
	} catch (error) {
		log.error({ err: error }, "Error backfilling proxyMode");
		throw error;
	}
}
