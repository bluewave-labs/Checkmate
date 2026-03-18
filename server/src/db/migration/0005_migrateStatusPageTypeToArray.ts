import mongoose from "mongoose";
import { logger } from "@/utils/logger.js";
import StatusPageModel from "../models/StatusPage.js";

export async function migrateStatusPageTypeToArray(): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateStatusPageTypeToArray";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting migration of StatusPage type field from string to array" });

		const db = mongoose.connection.db;
		if (!db) {
			throw new Error("Database connection is not initialized");
		}

		const result = await StatusPageModel.updateMany(
			{
				$expr: {
					$eq: [{ $type: "$type" }, "string"], // only scalar string, not existing array
				},
			},
			[
				{
					$set: {
						type: ["$type"],
					},
				},
			]
		);

		if (result.modifiedCount === 0) {
			logger.info({ service: SERVICE_NAME, message: "No StatusPage documents needed migration" });
			return;
		}

		logger.info({
			service: SERVICE_NAME,
			message: `Migration complete. Converted ${result.modifiedCount} StatusPage document(s) from string type to array type`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error during StatusPage type migration: ${errorMessage}` });
		throw error;
	}
}
