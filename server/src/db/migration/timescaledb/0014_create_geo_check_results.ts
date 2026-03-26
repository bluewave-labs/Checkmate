import type { Pool } from "pg";

export const createGeoCheckResults = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS geo_check_results (
			id                      UUID NOT NULL DEFAULT gen_random_uuid(),
			geo_check_id            UUID NOT NULL,
			geo_check_created_at    TIMESTAMPTZ NOT NULL,

			-- Status
			status                  BOOLEAN,
			status_code             INTEGER,

			-- Location
			location_continent      TEXT,
			location_region         TEXT,
			location_country        TEXT,
			location_state          TEXT,
			location_city           TEXT,
			location_longitude      DOUBLE PRECISION,
			location_latitude       DOUBLE PRECISION,

			-- Timings
			timing_total            DOUBLE PRECISION,
			timing_dns              DOUBLE PRECISION,
			timing_tcp              DOUBLE PRECISION,
			timing_tls              DOUBLE PRECISION,
			timing_first_byte       DOUBLE PRECISION,
			timing_download         DOUBLE PRECISION
		);

		SELECT create_hypertable('geo_check_results', 'geo_check_created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_geo_results_check
			ON geo_check_results (geo_check_id, geo_check_created_at);
		CREATE INDEX IF NOT EXISTS idx_geo_results_country
			ON geo_check_results (location_country, geo_check_created_at DESC);
	`);
};

export const dropGeoCheckResults = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS geo_check_results;`);
};
