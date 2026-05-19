import { logger } from "@/utils/logger.js";
import StatusPageModel from "../models/StatusPage.js";
import StatusPageLockoutModel from "../models/StatusPageLockout.js";

export async function addStatusPagePassword(): Promise<void> {
	const SERVICE_NAME = "Migration:AddStatusPagePassword";

	try {
		logger.info({ service: SERVICE_NAME, message: "Backfilling passwordHash and passwordVersion on StatusPage documents" });

		const result = await StatusPageModel.updateMany(
			{
				$or: [{ passwordHash: { $exists: false } }, { passwordVersion: { $exists: false } }],
			},
			{
				$set: { passwordHash: null, passwordVersion: 0 },
			}
		);

		logger.info({
			service: SERVICE_NAME,
			message: `Backfill complete. Modified ${result.modifiedCount} StatusPage document(s).`,
		});

		await StatusPageLockoutModel.syncIndexes();
		logger.info({ service: SERVICE_NAME, message: "StatusPageLockout indexes synced" });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error during StatusPage password migration: ${errorMessage}` });
		throw error;
	}
}
