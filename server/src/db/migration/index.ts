import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";
import { convertChecksToTimeSeries } from "./0002_convertChecksToTimeSeries.js";
import { cleanupDuplicateMonitorStats } from "./0003_cleanupDuplicateMonitorStats.js";
import { fixInfrastructureThresholds } from "./0004_fixInfrastructureThresholds.js";
import MigrationModel from "../../domain/migrations/migration.model.js";
import { migrateStatusPageTypeToArray } from "./0005_migrateStatusPageTypeToArray.js";
import { cleanupDuplicateMonitorStatsForUniqueIndex } from "./0006_cleanupDuplicateMonitorStatsForUniqueIndex.js";
import { migrateMaintenanceWindowMonitorIdToArray } from "./0007_migrateMaintenanceWindowMonitorIdToArray.js";
import { backfillMonitorLastEvaluatedAt } from "./0008_backfillMonitorLastEvaluatedAt.js";
import { recomputeResponseTimeFromTimings } from "./0009_recomputeResponseTimeFromTimings.js";
import { slimRecentChecks } from "./0010_slimRecentChecks.js";
import { backfillMonitorProxyMode } from "./0011_backfillMonitorProxyMode.js";
import { migrateDockerMonitorUrls } from "./0012_migrateDockerMonitorUrls.js";
import { migrateMonitorIntervalToMs } from "./0013_migrateMonitorIntervalToMs.js";
import type { ILogger } from "@/utils/logger.js";
import type { ILogger } from "@/utils/logger/logger.js";

type MigrationEntry = {
	name: string;
	execute: (logger: ILogger) => Promise<void>;
};

const migrations: MigrationEntry[] = [
	{ name: "0001_migrateStatusWindowThreshold", execute: migrateStatusWindowThreshold },
	{ name: "0002_convertChecksToTimeSeries", execute: convertChecksToTimeSeries },
	{ name: "0003_cleanupDuplicateMonitorStats", execute: cleanupDuplicateMonitorStats },
	{ name: "0004_fixInfrastructureThresholds", execute: fixInfrastructureThresholds },
	{ name: "0005_migrateStatusPageTypeToArray", execute: migrateStatusPageTypeToArray },
	{ name: "0006_cleanupDuplicateMonitorStatsForUniqueIndex", execute: cleanupDuplicateMonitorStatsForUniqueIndex },
	{ name: "0007_migrateMaintenanceWindowMonitorIdToArray", execute: migrateMaintenanceWindowMonitorIdToArray },
	{ name: "0008_backfillMonitorLastEvaluatedAt", execute: backfillMonitorLastEvaluatedAt },
	{ name: "0009_recomputeResponseTimeFromTimings", execute: recomputeResponseTimeFromTimings },
	{ name: "0010_slimRecentChecks", execute: slimRecentChecks },
	{ name: "0011_backfillMonitorProxyMode", execute: backfillMonitorProxyMode },
	{ name: "0012_migrateDockerMonitorUrls", execute: migrateDockerMonitorUrls },
	{ name: "0013_migrateMonitorIntervalToMs", execute: migrateMonitorIntervalToMs },
];

const runMigrations = async (logger: ILogger) => {
	const log = logger.child({ service: "Migrations" });
	try {
		log.info("Running migrations");
		for (const migration of migrations) {
			const exists = await MigrationModel.findOne({ name: migration.name, status: "completed" });
			if (exists) {
				log.info({ migration: migration.name }, "Skipping migration");
				continue;
			}

			try {
				await migration.execute(logger);
				await MigrationModel.findOneAndUpdate(
					{ name: migration.name },
					{ status: "completed", completedAt: new Date(), error: undefined },
					{ upsert: true }
				);
				log.info({ migration: migration.name }, "Completed migration");
			} catch (error) {
				const err = error as Error;
				await MigrationModel.findOneAndUpdate({ name: migration.name }, { status: "failed", error: err?.message }, { upsert: true });
				throw error;
			}
		}
		log.info("Migrations completed");
	} catch (error) {
		log.error({ err: error }, "Migration failed");
		throw error;
	}
};

export { runMigrations };
