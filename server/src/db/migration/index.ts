import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";
import { convertChecksToTimeSeries } from "./0002_convertChecksToTimeSeries.js";
import { cleanupDuplicateMonitorStats } from "./0003_cleanupDuplicateMonitorStats.js";
import { fixInfrastructureThresholds } from "./0004_fixInfrastructureThresholds.js";
import MigrationModel from "../models/Migration.js";
import { migrateStatusPageTypeToArray } from "./0005_migrateStatusPageTypeToArray.js";
import { cleanupDuplicateMonitorStatsForUniqueIndex } from "./0006_cleanupDuplicateMonitorStatsForUniqueIndex.js";
import { dropMaintenanceWindowExpiryIndex } from "./0007_dropMaintenanceWindowExpiryIndex.js";
import type { ILogger } from "@/utils/logger.js";

type MigrationEntry = {
	name: string;
	execute: () => Promise<void>;
};

const migrations: MigrationEntry[] = [
	{ name: "0001_migrateStatusWindowThreshold", execute: migrateStatusWindowThreshold },
	{ name: "0002_convertChecksToTimeSeries", execute: convertChecksToTimeSeries },
	{ name: "0003_cleanupDuplicateMonitorStats", execute: cleanupDuplicateMonitorStats },
	{ name: "0004_fixInfrastructureThresholds", execute: fixInfrastructureThresholds },
	{ name: "0005_migrateStatusPageTypeToArray", execute: migrateStatusPageTypeToArray },
	{ name: "0006_cleanupDuplicateMonitorStatsForUniqueIndex", execute: cleanupDuplicateMonitorStatsForUniqueIndex },
	{ name: "0007_dropMaintenanceWindowExpiryIndex", execute: dropMaintenanceWindowExpiryIndex },
];

const runMigrations = async (logger?: ILogger) => {
	try {
		logger?.info({ message: "Running migrations", service: "Migrations" });
		for (const migration of migrations) {
			const exists = await MigrationModel.findOne({ name: migration.name, status: "completed" });
			if (exists) {
				logger?.info({ message: `Skipping ${migration.name}`, service: "Migrations" });
				continue;
			}

			try {
				await migration.execute();
				await MigrationModel.findOneAndUpdate(
					{ name: migration.name },
					{ status: "completed", completedAt: new Date(), error: undefined },
					{ upsert: true }
				);
				logger?.info({ message: `Completed ${migration.name}`, service: "Migrations" });
			} catch (error) {
				const err = error as Error;
				await MigrationModel.findOneAndUpdate({ name: migration.name }, { status: "failed", error: err?.message }, { upsert: true });
				throw error;
			}
		}
		logger?.info({ message: "Migrations completed", service: "Migrations" });
	} catch (error) {
		const err = error as Error;
		logger?.error({ message: "Migration failed", service: "Migrations", details: { error: err?.message }, stack: err?.stack });
		throw error;
	}
};

export { runMigrations };
