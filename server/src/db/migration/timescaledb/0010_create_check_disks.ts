import type { Pool } from "pg";

export const createCheckDisks = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS check_disks (
			id                  UUID NOT NULL DEFAULT gen_random_uuid(),
			check_id            UUID NOT NULL,
			check_created_at    TIMESTAMPTZ NOT NULL,
			device              TEXT,
			mountpoint          TEXT,
			total_bytes         BIGINT,
			free_bytes          BIGINT,
			used_bytes          BIGINT,
			usage_percent       DOUBLE PRECISION,
			total_inodes        BIGINT,
			free_inodes         BIGINT,
			used_inodes         BIGINT,
			inodes_usage_percent DOUBLE PRECISION,
			read_bytes          BIGINT,
			write_bytes         BIGINT,
			read_time           BIGINT,
			write_time          BIGINT
		);

		SELECT create_hypertable('check_disks', 'check_created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_check_disks_check
			ON check_disks (check_id, check_created_at);
	`);
};

export const dropCheckDisks = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS check_disks;`);
};
