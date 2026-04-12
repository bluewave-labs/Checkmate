import type { Pool } from "pg";

export const createContinuousAggregates = async (pool: Pool) => {
	// Uptime & Response Time (Hourly)
	await pool.query(`
		CREATE MATERIALIZED VIEW IF NOT EXISTS checks_hourly
		WITH (timescaledb.continuous) AS
		SELECT
			monitor_id,
			time_bucket('1 hour', created_at) AS bucket,
			COUNT(*)                                    AS total_checks,
			COUNT(*) FILTER (WHERE status = TRUE)       AS up_checks,
			COUNT(*) FILTER (WHERE status = FALSE)      AS down_checks,
			AVG(response_time)                          AS avg_response_time,
			AVG(response_time) FILTER (WHERE status = TRUE)  AS avg_up_response_time,
			AVG(response_time) FILTER (WHERE status = FALSE) AS avg_down_response_time,
			MAX(response_time)                          AS max_response_time,
			MIN(response_time)                          AS min_response_time
		FROM checks
		GROUP BY monitor_id, bucket
		WITH NO DATA;
	`);
	await pool.query(`ALTER MATERIALIZED VIEW checks_hourly SET (timescaledb.materialized_only = false);`);
	await pool.query(`
		SELECT add_continuous_aggregate_policy('checks_hourly',
			start_offset    => INTERVAL '3 hours',
			end_offset      => INTERVAL '1 hour',
			schedule_interval => INTERVAL '1 hour',
			if_not_exists   => TRUE
		);
	`);
	await pool.query(`CALL refresh_continuous_aggregate('checks_hourly', NULL, NULL);`);

	// Uptime & Response Time (Daily)
	await pool.query(`
		CREATE MATERIALIZED VIEW IF NOT EXISTS checks_daily
		WITH (timescaledb.continuous) AS
		SELECT
			monitor_id,
			time_bucket('1 day', created_at) AS bucket,
			COUNT(*)                                    AS total_checks,
			COUNT(*) FILTER (WHERE status = TRUE)       AS up_checks,
			COUNT(*) FILTER (WHERE status = FALSE)      AS down_checks,
			AVG(response_time)                          AS avg_response_time,
			AVG(response_time) FILTER (WHERE status = TRUE)  AS avg_up_response_time,
			AVG(response_time) FILTER (WHERE status = FALSE) AS avg_down_response_time,
			MAX(response_time)                          AS max_response_time
		FROM checks
		GROUP BY monitor_id, bucket
		WITH NO DATA;
	`);
	await pool.query(`ALTER MATERIALIZED VIEW checks_daily SET (timescaledb.materialized_only = false);`);
	await pool.query(`
		SELECT add_continuous_aggregate_policy('checks_daily',
			start_offset    => INTERVAL '3 days',
			end_offset      => INTERVAL '1 day',
			schedule_interval => INTERVAL '1 day',
			if_not_exists   => TRUE
		);
	`);
	await pool.query(`CALL refresh_continuous_aggregate('checks_daily', NULL, NULL);`);

	// Infrastructure Metrics (Hourly)
	await pool.query(`
		CREATE MATERIALIZED VIEW IF NOT EXISTS hardware_hourly
		WITH (timescaledb.continuous) AS
		SELECT
			monitor_id,
			time_bucket('1 hour', created_at) AS bucket,
			AVG(cpu_usage_percent)              AS avg_cpu,
			MAX(cpu_usage_percent)              AS max_cpu,
			AVG(mem_usage_percent)              AS avg_memory,
			MAX(mem_usage_percent)              AS max_memory,
			COUNT(*)                            AS sample_count
		FROM checks
		WHERE monitor_type = 'hardware'
		GROUP BY monitor_id, bucket
		WITH NO DATA;
	`);
	await pool.query(`ALTER MATERIALIZED VIEW hardware_hourly SET (timescaledb.materialized_only = false);`);
	await pool.query(`
		SELECT add_continuous_aggregate_policy('hardware_hourly',
			start_offset    => INTERVAL '3 hours',
			end_offset      => INTERVAL '1 hour',
			schedule_interval => INTERVAL '1 hour',
			if_not_exists   => TRUE
		);
	`);
	await pool.query(`CALL refresh_continuous_aggregate('hardware_hourly', NULL, NULL);`);

	// PageSpeed Scores (Daily)
	await pool.query(`
		CREATE MATERIALIZED VIEW IF NOT EXISTS pagespeed_daily
		WITH (timescaledb.continuous) AS
		SELECT
			monitor_id,
			time_bucket('1 day', created_at) AS bucket,
			AVG(lighthouse_performance)         AS avg_performance,
			AVG(lighthouse_accessibility)       AS avg_accessibility,
			AVG(lighthouse_best_practices)      AS avg_best_practices,
			AVG(lighthouse_seo)                 AS avg_seo,
			COUNT(*)                            AS sample_count
		FROM checks
		WHERE monitor_type = 'pagespeed'
		GROUP BY monitor_id, bucket
		WITH NO DATA;
	`);
	await pool.query(`ALTER MATERIALIZED VIEW pagespeed_daily SET (timescaledb.materialized_only = false);`);
	await pool.query(`
		SELECT add_continuous_aggregate_policy('pagespeed_daily',
			start_offset    => INTERVAL '3 days',
			end_offset      => INTERVAL '1 day',
			schedule_interval => INTERVAL '1 day',
			if_not_exists   => TRUE
		);
	`);
	await pool.query(`CALL refresh_continuous_aggregate('pagespeed_daily', NULL, NULL);`);
};

export const dropContinuousAggregates = async (pool: Pool) => {
	await pool.query(`
		DROP MATERIALIZED VIEW IF EXISTS pagespeed_daily CASCADE;
		DROP MATERIALIZED VIEW IF EXISTS hardware_hourly CASCADE;
		DROP MATERIALIZED VIEW IF EXISTS checks_daily CASCADE;
		DROP MATERIALIZED VIEW IF EXISTS checks_hourly CASCADE;
	`);
};
