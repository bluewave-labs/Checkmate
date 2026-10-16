import mongoose from "mongoose";
import type { ILogger } from "@/utils/logger/logger.js";
import StatusPageModel from "../../domain/status-pages/status-page.model.js";
import { AppError, internalError } from "@/utils/AppError.js";

export async function migrateStatusPageTypeToArray(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateStatusPageTypeToArray";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting migration of StatusPage type field from string to array");

		const db = mongoose.connection.db;
		if (!db) {
			throw new AppError(internalError, {
				message: "Database connection is not initialized",
				service: SERVICE_NAME,
				method: "migrateStatusPageTypeToArray",
			});
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
			log.info("No StatusPage documents needed migration");
			return;
		}

		log.info({ modifiedCount: result.modifiedCount }, "Migration complete, converted StatusPage documents from string type to array type");
	} catch (error) {
		log.error({ err: error }, "Error during StatusPage type migration");
		throw error;
	}
}
