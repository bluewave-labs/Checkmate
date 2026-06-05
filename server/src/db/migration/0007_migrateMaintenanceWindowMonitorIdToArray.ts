import mongoose from "mongoose";
import type { AnyBulkWriteOperation, Document } from "mongodb";
import { logger } from "@/utils/logger.js";
import MaintenanceWindowModel from "../models/MaintenanceWindow.js";

type GroupResult = {
	_id: {
		teamId: mongoose.Types.ObjectId;
		name: string;
		start: Date;
		end: Date;
		repeat: number;
		durationUnit: string;
		duration: number;
		active: boolean;
	};
	docIds: mongoose.Types.ObjectId[];
	monitorIds: mongoose.Types.ObjectId[];
};

export async function migrateMaintenanceWindowMonitorIdToArray(): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateMaintenanceWindowMonitorIdToArray";

	try {
		logger.info({
			service: SERVICE_NAME,
			message: "Starting migration of MaintenanceWindow.monitorId to monitorIds array (eager merge)",
		});

		const db = mongoose.connection.db;
		if (!db) {
			throw new Error("Database connection is not initialized");
		}

		// Group old-style docs by their scheduling key.
		// Skip rows that already have a monitorIds array — those are either already migrated
		// or in a partially-migrated state that needs manual review.
		const groups: GroupResult[] = await MaintenanceWindowModel.aggregate<GroupResult>([
			{
				$match: {
					monitorId: { $exists: true, $ne: null },
					monitorIds: { $exists: false },
				},
			},
			{
				$group: {
					_id: {
						teamId: "$teamId",
						name: "$name",
						start: "$start",
						end: "$end",
						repeat: "$repeat",
						durationUnit: "$durationUnit",
						duration: "$duration",
						active: "$active",
					},
					docIds: { $push: "$_id" },
					monitorIds: { $addToSet: "$monitorId" },
				},
			},
		]);

		if (groups.length === 0) {
			logger.info({ service: SERVICE_NAME, message: "No MaintenanceWindow documents needed migration" });
			return;
		}

		const bulkOps: AnyBulkWriteOperation<Document>[] = [];
		let originalDocCount = 0;

		for (const group of groups) {
			const { docIds, monitorIds } = group;
			originalDocCount += docIds.length;
			const [survivorId, ...duplicateIds] = docIds;

			bulkOps.push({
				updateOne: {
					filter: { _id: survivorId },
					update: {
						$set: { monitorIds },
						$unset: { monitorId: "" },
					},
				},
			});

			if (duplicateIds.length > 0) {
				bulkOps.push({
					deleteMany: {
						filter: { _id: { $in: duplicateIds } },
					},
				});
			}
		}

		const result = await MaintenanceWindowModel.collection.bulkWrite(bulkOps, { ordered: true });
		const deletedCount = originalDocCount - groups.length;

		logger.info({
			service: SERVICE_NAME,
			message: `Migration complete. Consolidated ${originalDocCount} old document(s) into ${groups.length} group window(s); deleted ${deletedCount} duplicate(s).`,
		});
		logger.debug({
			service: SERVICE_NAME,
			message: `bulkWrite result: modified=${result.modifiedCount}, deleted=${result.deletedCount}`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error during MaintenanceWindow migration: ${errorMessage}` });
		throw error;
	}
}
