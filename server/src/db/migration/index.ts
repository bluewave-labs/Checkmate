import { migrateStatusWindowThreshold } from "./0001_migrateStatusWindowThreshold.js";
import { convertChecksToTimeSeries } from "./0002_convertChecksToTimeSeries.js";
import { cleanupDuplicateMonitorStats } from "./0003_cleanupDuplicateMonitorStats.js";
import MigrationModel from "../models/Migration.js";

type MigrationEntry = {
	name: string;
	execute: () => Promise<void>;
};

const migrations: MigrationEntry[] = [
	{ name: "0001_migrateStatusWindowThreshold", execute: migrateStatusWindowThreshold },
	{ name: "0002_convertChecksToTimeSeries", execute: convertChecksToTimeSeries },
	{ name: "0003_cleanupDuplicateMonitorStats", execute: cleanupDuplicateMonitorStats },
];

const runMigrations = async (logger?: { info: Function; error: Function }) => {
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
		logger?.error({ message: "Migration failed", service: "Migrations", details: err?.message, stack: err?.stack });
		throw error;
	}
};

export { runMigrations };
