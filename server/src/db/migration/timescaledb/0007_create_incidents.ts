import type { Pool } from "pg";

export const createIncidents = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS incidents (
			id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			monitor_id          UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
			team_id             UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
			start_time          TIMESTAMPTZ NOT NULL,
			end_time            TIMESTAMPTZ,
			status              BOOLEAN,
			message             TEXT,
			status_code         INTEGER,
			resolution_type     incident_resolution_type,
			resolved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
			resolved_by_email   TEXT,
			comment             TEXT,
			created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_incidents_monitor_status ON incidents (monitor_id, status);
		CREATE INDEX IF NOT EXISTS idx_incidents_team_status ON incidents (team_id, status);
		CREATE INDEX IF NOT EXISTS idx_incidents_team_start ON incidents (team_id, start_time DESC);
		CREATE INDEX IF NOT EXISTS idx_incidents_status_start ON incidents (status, start_time DESC);
		CREATE INDEX IF NOT EXISTS idx_incidents_resolution ON incidents (resolution_type, status);
		CREATE INDEX IF NOT EXISTS idx_incidents_resolved_by ON incidents (resolved_by, status);
		CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents (created_at DESC);
	`);
};

export const dropIncidents = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS incidents;`);
};
