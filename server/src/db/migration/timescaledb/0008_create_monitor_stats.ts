import type { Pool } from "pg";

export const createMonitorStats = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS monitor_stats (
			id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			monitor_id              UUID NOT NULL UNIQUE REFERENCES monitors(id) ON DELETE CASCADE,
			avg_response_time       DOUBLE PRECISION DEFAULT 0,
			max_response_time       DOUBLE PRECISION DEFAULT 0,
			total_checks            BIGINT DEFAULT 0,
			total_up_checks         BIGINT DEFAULT 0,
			total_down_checks       BIGINT DEFAULT 0,
			uptime_percentage       DOUBLE PRECISION DEFAULT 0,
			last_check_timestamp    TIMESTAMPTZ,
			last_response_time      DOUBLE PRECISION DEFAULT 0,
			time_of_last_failure    TIMESTAMPTZ,
			created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);
};

export const dropMonitorStats = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS monitor_stats;`);
};
