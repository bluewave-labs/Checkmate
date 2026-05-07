import mongoose from "mongoose";
import { logger } from "@/utils/logger.js";

/**
 * Drops the TTL index on MaintenanceWindow.expiry and unsets the field on existing rows.
 *
 * Why: a previous version copied `end` into `expiry` for one-time windows. Combined with the
 * TTL index on `expiry`, this caused Mongo to silently delete rows whose `end` was in the past
 * at creation time (a common symptom for automation tools sending non-UTC timestamps). The
 * fix stops writing `expiry`; this migration removes the live exposure on existing installs.
 */
export async function dropMaintenanceWindowExpiryIndex(): Promise<void> {
	const SERVICE_NAME = "Migration:DropMaintenanceWindowExpiryIndex";

	try {
		logger.info({
			service: SERVICE_NAME,
			message: "Starting drop of MaintenanceWindow.expiry TTL index",
		});

		const db = mongoose.connection.db;
		if (!db) {
			throw new Error("Mongo connection not initialized");
		}
		const collection = db.collection("maintenancewindows");

		const indexes = await collection.indexes();
		const expiryIndex = indexes.find(
			(idx) => idx.expireAfterSeconds !== undefined && idx.key && Object.keys(idx.key).length === 1 && idx.key.expiry === 1
		);

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
