import type { Pool } from "pg";

export const createCheckNetworkInterfaces = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS check_network_interfaces (
			id                  UUID NOT NULL DEFAULT gen_random_uuid(),
			check_id            UUID NOT NULL,
			check_created_at    TIMESTAMPTZ NOT NULL,
			name                TEXT,
			bytes_sent          BIGINT,
			bytes_recv          BIGINT,
			packets_sent        BIGINT,
			packets_recv        BIGINT,
			err_in              BIGINT,
			err_out             BIGINT,
			drop_in             BIGINT,
			drop_out            BIGINT,
			fifo_in             BIGINT,
			fifo_out            BIGINT
		);

		SELECT create_hypertable('check_network_interfaces', 'check_created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_check_net_check
			ON check_network_interfaces (check_id, check_created_at);
	`);
};

export const dropCheckNetworkInterfaces = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS check_network_interfaces;`);
};
