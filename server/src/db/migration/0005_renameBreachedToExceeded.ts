import { MonitorModel } from "../models/Monitor.js";
import { logger } from "@/utils/logger.js";

/**
 * Rename monitor status "breached" to "exceeded" for clarity.
 * The word "breached" was confusing users as it implied a security breach.
 */
export async function renameBreachedToExceeded(): Promise<void> {
	const SERVICE_NAME = "Migration:RenameBreachedToExceeded";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting status rename: breached -> exceeded" });

		const result = await MonitorModel.updateMany({ status: "breached" }, { $set: { status: "exceeded" } });

		logger.info({
			service: SERVICE_NAME,
			message: `Updated ${result.modifiedCount} monitors from 'breached' to 'exceeded'`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error renaming status: ${errorMessage}` });
		throw error;
	}
}
