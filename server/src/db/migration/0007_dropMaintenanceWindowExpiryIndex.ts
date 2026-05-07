import { MaintenanceWindowModel } from "../models/MaintenanceWindow.js";
import { logger } from "@/utils/logger.js";

/**
 * Drops the TTL index on MaintenanceWindow.expiry and unsets the expiry field.
 *
 * Earlier versions auto-set expiry = end for one-time maintenance windows. Combined with the
 * TTL index ({ expires: "0s" }), this caused Mongo to silently delete completed one-time
 * windows shortly after their end-date passed — including windows whose end-date was already
 * in the past at creation time (e.g. timezone-mismatched payloads from automation tools).
 * The fix stops writing expiry on create, and this migration removes the index and stale field
 * so legacy rows are no longer at risk of being deleted by the TTL monitor.
 */
export async function dropMaintenanceWindowExpiryIndex(): Promise<void> {
	const SERVICE_NAME = "Migration:DropMaintenanceWindowExpiryIndex";

	try {
		const collection = MaintenanceWindowModel.collection;
		const indexes = await collection.indexes();
		const expiryIndex = indexes.find((idx) => idx.key && idx.key.expiry === 1);

		if (expiryIndex?.name) {
			await collection.dropIndex(expiryIndex.name);
			logger.info({
				service: SERVICE_NAME,
				message: `Dropped TTL index ${expiryIndex.name} on MaintenanceWindow.expiry`,
			});
		} else {
			logger.info({
				service: SERVICE_NAME,
				message: "No TTL index found on MaintenanceWindow.expiry",
			});
		}

		const result = await collection.updateMany({ expiry: { $exists: true } }, { $unset: { expiry: "" } });
		logger.info({
			service: SERVICE_NAME,
			message: `Unset expiry on ${result.modifiedCount} maintenance windows`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({
			service: SERVICE_NAME,
			message: `Error dropping expiry index: ${errorMessage}`,
		});
		throw error;
	}
}
