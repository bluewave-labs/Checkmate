import type { Pool } from "pg";
import type { ILogger } from "@/utils/logger.js";
import { createEnums, dropEnums } from "./0001_create_enums.js";
import { createTeams, dropTeams } from "./0002_create_teams.js";
import { createUsers, dropUsers } from "./0003_create_users.js";
import { createMonitors, dropMonitors } from "./0004_create_monitors.js";
import { createNotifications, dropNotifications } from "./0005_create_notifications.js";
import { createMonitorNotifications, dropMonitorNotifications } from "./0006_create_monitor_notifications.js";
import { createIncidents, dropIncidents } from "./0007_create_incidents.js";
import { createMonitorStats, dropMonitorStats } from "./0008_create_monitor_stats.js";
import { createChecks, dropChecks } from "./0009_create_checks.js";
import { createCheckDisks, dropCheckDisks } from "./0010_create_check_disks.js";
import { createCheckNetworkInterfaces, dropCheckNetworkInterfaces } from "./0011_create_check_network_interfaces.js";
import { createCheckErrors, dropCheckErrors } from "./0012_create_check_errors.js";
import { createGeoChecks, dropGeoChecks } from "./0013_create_geo_checks.js";
import { createGeoCheckResults, dropGeoCheckResults } from "./0014_create_geo_check_results.js";
import { createInvites, dropInvites } from "./0015_create_invites.js";
import { createRecoveryTokens, dropRecoveryTokens } from "./0016_create_recovery_tokens.js";
import { createMaintenanceWindows, dropMaintenanceWindows } from "./0017_create_maintenance_windows.js";
import { createStatusPages, dropStatusPages } from "./0018_create_status_pages.js";
import { createAppSettings, dropAppSettings } from "./0019_create_app_settings.js";
import { createContinuousAggregates, dropContinuousAggregates } from "./0020_create_continuous_aggregates.js";
import { createRetentionCompression, dropRetentionCompression } from "./0021_create_retention_compression.js";
import { addIncidentSeverity, dropIncidentSeverity } from "./0022_add_incident_severity.js";

const SERVICE_NAME = "TimescaleDB Migrations";

type MigrationEntry = {
	name: string;
	up: (pool: Pool) => Promise<void>;
	down: (pool: Pool) => Promise<void>;
};

const migrations: MigrationEntry[] = [
	{ name: "0001_create_enums", up: createEnums, down: dropEnums },
	{ name: "0002_create_teams", up: createTeams, down: dropTeams },
	{ name: "0003_create_users", up: createUsers, down: dropUsers },
	{ name: "0004_create_monitors", up: createMonitors, down: dropMonitors },
	{ name: "0005_create_notifications", up: createNotifications, down: dropNotifications },
	{ name: "0006_create_monitor_notifications", up: createMonitorNotifications, down: dropMonitorNotifications },
	{ name: "0007_create_incidents", up: createIncidents, down: dropIncidents },
	{ name: "0008_create_monitor_stats", up: createMonitorStats, down: dropMonitorStats },
	{ name: "0009_create_checks", up: createChecks, down: dropChecks },
	{ name: "0010_create_check_disks", up: createCheckDisks, down: dropCheckDisks },
	{ name: "0011_create_check_network_interfaces", up: createCheckNetworkInterfaces, down: dropCheckNetworkInterfaces },
	{ name: "0012_create_check_errors", up: createCheckErrors, down: dropCheckErrors },
	{ name: "0013_create_geo_checks", up: createGeoChecks, down: dropGeoChecks },
	{ name: "0014_create_geo_check_results", up: createGeoCheckResults, down: dropGeoCheckResults },
	{ name: "0015_create_invites", up: createInvites, down: dropInvites },
	{ name: "0016_create_recovery_tokens", up: createRecoveryTokens, down: dropRecoveryTokens },
	{ name: "0017_create_maintenance_windows", up: createMaintenanceWindows, down: dropMaintenanceWindows },
	{ name: "0018_create_status_pages", up: createStatusPages, down: dropStatusPages },
	{ name: "0019_create_app_settings", up: createAppSettings, down: dropAppSettings },
	{ name: "0020_create_continuous_aggregates", up: createContinuousAggregates, down: dropContinuousAggregates },
	{ name: "0021_create_retention_compression", up: createRetentionCompression, down: dropRetentionCompression },
	{ name: "0022_add_incident_severity", up: addIncidentSeverity, down: dropIncidentSeverity },
];

const ensureMigrationsTable = async (pool: Pool) => {
	await pool.query(`
		DO $$ BEGIN
			CREATE TYPE migration_status AS ENUM ('completed', 'failed');
		EXCEPTION
			WHEN duplicate_object THEN NULL;
		END $$;
	`);
	await pool.query(`
		CREATE TABLE IF NOT EXISTS migrations (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name            TEXT NOT NULL UNIQUE,
			status          migration_status NOT NULL,
			completed_at    TIMESTAMPTZ,
			error           TEXT,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);
};

const runTimescaleDBMigrations = async (pool: Pool, logger?: ILogger) => {
	try {
		logger?.info({ message: "Running migrations", service: SERVICE_NAME });

		await ensureMigrationsTable(pool);

		for (const migration of migrations) {
			const result = await pool.query("SELECT 1 FROM migrations WHERE name = $1 AND status = 'completed'", [migration.name]);
			if (result.rowCount !== null && result.rowCount > 0) {
				logger?.info({ message: `Skipping ${migration.name}`, service: SERVICE_NAME });
				continue;
			}

			try {
				await migration.up(pool);
				await pool.query(
					`INSERT INTO migrations (name, status, completed_at)
					 VALUES ($1, 'completed', NOW())
					 ON CONFLICT (name) DO UPDATE SET status = 'completed', completed_at = NOW(), error = NULL, updated_at = NOW()`,
					[migration.name]
				);
				logger?.info({ message: `Completed ${migration.name}`, service: SERVICE_NAME });
			} catch (error) {
				const err = error as Error;
				await pool.query(
					`INSERT INTO migrations (name, status, error)
					 VALUES ($1, 'failed', $2)
					 ON CONFLICT (name) DO UPDATE SET status = 'failed', error = $2, updated_at = NOW()`,
					[migration.name, err?.message]
				);
				throw error;
			}
		}

		logger?.info({ message: "Migrations completed", service: SERVICE_NAME });
	} catch (error) {
		const err = error as Error;
		logger?.error({ message: "Migration failed", service: SERVICE_NAME, details: { error: err?.message }, stack: err?.stack });
		throw error;
	}
};

const rollbackTimescaleDBMigration = async (pool: Pool, logger?: ILogger) => {
	try {
		await ensureMigrationsTable(pool);

		// Find the last completed migration
		const result = await pool.query("SELECT name FROM migrations WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1");
		if (result.rowCount === 0) {
			logger?.info({ message: "No migrations to roll back", service: SERVICE_NAME });
			return;
		}

		const lastMigrationName = result.rows[0].name;
		const migration = migrations.find((m) => m.name === lastMigrationName);
		if (!migration) {
			throw new Error(`Migration "${lastMigrationName}" not found in migration list`);
		}

		logger?.info({ message: `Rolling back ${migration.name}`, service: SERVICE_NAME });
		await migration.down(pool);
		await pool.query("DELETE FROM migrations WHERE name = $1", [migration.name]);
		logger?.info({ message: `Rolled back ${migration.name}`, service: SERVICE_NAME });
	} catch (error) {
		const err = error as Error;
		logger?.error({ message: "Rollback failed", service: SERVICE_NAME, details: { error: err?.message }, stack: err?.stack });
		throw error;
	}
};

export { runTimescaleDBMigrations, rollbackTimescaleDBMigration };
