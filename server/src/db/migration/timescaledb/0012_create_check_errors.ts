import type { Pool } from "pg";

export const createCheckErrors = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS check_errors (
			id                  UUID NOT NULL DEFAULT gen_random_uuid(),
			check_id            UUID NOT NULL,
			check_created_at    TIMESTAMPTZ NOT NULL,
			metrics             TEXT[],
			error               TEXT
		);

		SELECT create_hypertable('check_errors', 'check_created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_check_errors_check
			ON check_errors (check_id, check_created_at);
	`);
};

export const dropCheckErrors = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS check_errors;`);
};
