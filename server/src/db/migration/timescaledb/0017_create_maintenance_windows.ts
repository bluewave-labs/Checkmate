import type { Pool } from "pg";

export const createMaintenanceWindows = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS maintenance_windows (
			id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
			team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
			active          BOOLEAN NOT NULL DEFAULT TRUE,
			name            TEXT,
			duration        INTEGER,
			duration_unit   duration_unit,
			repeat          INTEGER,
			start_time      TIMESTAMPTZ,
			end_time        TIMESTAMPTZ,
			expiry          TIMESTAMPTZ,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_maint_monitor ON maintenance_windows (monitor_id);
		CREATE INDEX IF NOT EXISTS idx_maint_team ON maintenance_windows (team_id);
		CREATE INDEX IF NOT EXISTS idx_maint_expiry ON maintenance_windows (expiry);
	`);
};

export const dropMaintenanceWindows = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS maintenance_windows;`);
};
