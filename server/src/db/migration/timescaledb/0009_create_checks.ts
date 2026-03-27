import type { Pool } from "pg";

export const createChecks = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS checks (
			id                          UUID NOT NULL DEFAULT gen_random_uuid(),
			monitor_id                  UUID NOT NULL,
			team_id                     UUID NOT NULL,
			monitor_type                monitor_type NOT NULL,
			status                      BOOLEAN,
			response_time               INTEGER,
			status_code                 INTEGER,
			message                     TEXT,

			-- HTTP request timings
			timing_start                DOUBLE PRECISION,
			timing_socket               DOUBLE PRECISION,
			timing_lookup               DOUBLE PRECISION,
			timing_connect              DOUBLE PRECISION,
			timing_secure_connect       DOUBLE PRECISION,
			timing_upload               DOUBLE PRECISION,
			timing_response             DOUBLE PRECISION,
			timing_end                  DOUBLE PRECISION,
			phase_wait                  DOUBLE PRECISION,
			phase_dns                   DOUBLE PRECISION,
			phase_tcp                   DOUBLE PRECISION,
			phase_tls                   DOUBLE PRECISION,
			phase_request               DOUBLE PRECISION,
			phase_first_byte            DOUBLE PRECISION,
			phase_download              DOUBLE PRECISION,
			phase_total                 DOUBLE PRECISION,

			-- CPU metrics
			cpu_physical_core           INTEGER,
			cpu_logical_core            INTEGER,
			cpu_frequency               DOUBLE PRECISION,
			cpu_current_frequency       DOUBLE PRECISION,
			cpu_temperature             DOUBLE PRECISION[],
			cpu_free_percent            DOUBLE PRECISION,
			cpu_usage_percent           DOUBLE PRECISION,

			-- Memory metrics
			mem_total_bytes             BIGINT,
			mem_available_bytes         BIGINT,
			mem_used_bytes              BIGINT,
			mem_usage_percent           DOUBLE PRECISION,

			-- Host info
			host_os                     TEXT,
			host_platform               TEXT,
			host_kernel_version         TEXT,
			host_pretty_name            TEXT,

			-- Capture agent info
			capture_version             TEXT,
			capture_mode                TEXT,

			-- Lighthouse / PageSpeed scores
			lighthouse_performance      DOUBLE PRECISION,
			lighthouse_accessibility    DOUBLE PRECISION,
			lighthouse_best_practices   DOUBLE PRECISION,
			lighthouse_seo              DOUBLE PRECISION,

			-- Lighthouse audit details
			audit_cls_score             DOUBLE PRECISION,
			audit_cls_value             DOUBLE PRECISION,
			audit_cls_display           TEXT,
			audit_si_score              DOUBLE PRECISION,
			audit_si_value              DOUBLE PRECISION,
			audit_si_display            TEXT,
			audit_fcp_score             DOUBLE PRECISION,
			audit_fcp_value             DOUBLE PRECISION,
			audit_fcp_display           TEXT,
			audit_lcp_score             DOUBLE PRECISION,
			audit_lcp_value             DOUBLE PRECISION,
			audit_lcp_display           TEXT,
			audit_tbt_score             DOUBLE PRECISION,
			audit_tbt_value             DOUBLE PRECISION,
			audit_tbt_display           TEXT,

			created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		SELECT create_hypertable('checks', 'created_at',
			chunk_time_interval => INTERVAL '7 days',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_checks_monitor_time
			ON checks (monitor_id, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_checks_team_time
			ON checks (team_id, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_checks_monitor_type_time
			ON checks (monitor_id, monitor_type, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_checks_team_status_time
			ON checks (team_id, status, created_at DESC);
		CREATE INDEX IF NOT EXISTS idx_checks_status_code
			ON checks (status_code, created_at DESC);
	`);
};

export const dropChecks = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS checks;`);
};
