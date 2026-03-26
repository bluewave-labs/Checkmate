import type { Pool } from "pg";

export const createRetentionCompression = async (pool: Pool) => {
	// -- Compression policies --

	// Checks
	await pool.query(`
		ALTER TABLE checks SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'monitor_id',
			timescaledb.compress_orderby = 'created_at DESC'
		);
		SELECT add_compression_policy('checks', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	// Check child tables
	await pool.query(`
		ALTER TABLE check_disks SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'check_id',
			timescaledb.compress_orderby = 'check_created_at DESC'
		);
		SELECT add_compression_policy('check_disks', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	await pool.query(`
		ALTER TABLE check_network_interfaces SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'check_id',
			timescaledb.compress_orderby = 'check_created_at DESC'
		);
		SELECT add_compression_policy('check_network_interfaces', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	await pool.query(`
		ALTER TABLE check_errors SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'check_id',
			timescaledb.compress_orderby = 'check_created_at DESC'
		);
		SELECT add_compression_policy('check_errors', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	// Geo checks
	await pool.query(`
		ALTER TABLE geo_checks SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'monitor_id',
			timescaledb.compress_orderby = 'created_at DESC'
		);
		SELECT add_compression_policy('geo_checks', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	await pool.query(`
		ALTER TABLE geo_check_results SET (
			timescaledb.compress,
			timescaledb.compress_segmentby = 'geo_check_id',
			timescaledb.compress_orderby = 'geo_check_created_at DESC'
		);
		SELECT add_compression_policy('geo_check_results', INTERVAL '2 days', if_not_exists => TRUE);
	`);

	// -- Retention policies (default 30 days) --

	await pool.query(`
		SELECT add_retention_policy('checks', INTERVAL '30 days', if_not_exists => TRUE);
		SELECT add_retention_policy('check_disks', INTERVAL '30 days', if_not_exists => TRUE);
		SELECT add_retention_policy('check_network_interfaces', INTERVAL '30 days', if_not_exists => TRUE);
		SELECT add_retention_policy('check_errors', INTERVAL '30 days', if_not_exists => TRUE);
		SELECT add_retention_policy('geo_checks', INTERVAL '30 days', if_not_exists => TRUE);
		SELECT add_retention_policy('geo_check_results', INTERVAL '30 days', if_not_exists => TRUE);
	`);

	// -- Dynamic retention helper function --

	await pool.query(`
		CREATE OR REPLACE FUNCTION update_check_retention(new_ttl_days INTEGER)
		RETURNS VOID AS $$
		DECLARE
			ttl_interval INTERVAL;
		BEGIN
			ttl_interval := (new_ttl_days || ' days')::INTERVAL;

			PERFORM remove_retention_policy('checks', if_exists => true);
			PERFORM remove_retention_policy('check_disks', if_exists => true);
			PERFORM remove_retention_policy('check_network_interfaces', if_exists => true);
			PERFORM remove_retention_policy('check_errors', if_exists => true);
			PERFORM remove_retention_policy('geo_checks', if_exists => true);
			PERFORM remove_retention_policy('geo_check_results', if_exists => true);

			PERFORM add_retention_policy('checks', ttl_interval);
			PERFORM add_retention_policy('check_disks', ttl_interval);
			PERFORM add_retention_policy('check_network_interfaces', ttl_interval);
			PERFORM add_retention_policy('check_errors', ttl_interval);
			PERFORM add_retention_policy('geo_checks', ttl_interval);
			PERFORM add_retention_policy('geo_check_results', ttl_interval);
		END;
		$$ LANGUAGE plpgsql;
	`);
};

export const dropRetentionCompression = async (pool: Pool) => {
	// Remove retention policies
	await pool.query(`
		SELECT remove_retention_policy('checks', if_exists => true);
		SELECT remove_retention_policy('check_disks', if_exists => true);
		SELECT remove_retention_policy('check_network_interfaces', if_exists => true);
		SELECT remove_retention_policy('check_errors', if_exists => true);
		SELECT remove_retention_policy('geo_checks', if_exists => true);
		SELECT remove_retention_policy('geo_check_results', if_exists => true);
	`);

	// Remove compression policies
	await pool.query(`
		SELECT remove_compression_policy('checks', if_exists => true);
		SELECT remove_compression_policy('check_disks', if_exists => true);
		SELECT remove_compression_policy('check_network_interfaces', if_exists => true);
		SELECT remove_compression_policy('check_errors', if_exists => true);
		SELECT remove_compression_policy('geo_checks', if_exists => true);
		SELECT remove_compression_policy('geo_check_results', if_exists => true);
	`);

	// Disable compression on tables
	await pool.query(`
		ALTER TABLE checks SET (timescaledb.compress = false);
		ALTER TABLE check_disks SET (timescaledb.compress = false);
		ALTER TABLE check_network_interfaces SET (timescaledb.compress = false);
		ALTER TABLE check_errors SET (timescaledb.compress = false);
		ALTER TABLE geo_checks SET (timescaledb.compress = false);
		ALTER TABLE geo_check_results SET (timescaledb.compress = false);
	`);

	// Drop dynamic retention function
	await pool.query(`DROP FUNCTION IF EXISTS update_check_retention(INTEGER);`);
};
