import type { Pool } from "pg";

export const createGeoChecks = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS geo_checks (
			id              UUID NOT NULL DEFAULT gen_random_uuid(),
			monitor_id      UUID NOT NULL,
			team_id         UUID NOT NULL,
			monitor_type    monitor_type NOT NULL,
			expiry          TIMESTAMPTZ,
			created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		SELECT create_hypertable('geo_checks', 'created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_geo_checks_monitor_time
			ON geo_checks (monitor_id, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_geo_checks_team_time
			ON geo_checks (team_id, created_at DESC);
	`);
};

export const dropGeoChecks = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS geo_checks;`);
};
