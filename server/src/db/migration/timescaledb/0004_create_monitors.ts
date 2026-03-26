import type { Pool } from "pg";

export const createMonitors = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS monitors (
			id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id                 UUID NOT NULL REFERENCES users(id),
			team_id                 UUID NOT NULL REFERENCES teams(id),
			name                    TEXT NOT NULL,
			description             TEXT,
			type                    monitor_type NOT NULL,
			status                  monitor_status NOT NULL DEFAULT 'initializing',

			-- HTTP / Website monitoring
			url                     TEXT,
			port                    INTEGER,
			ignore_tls_errors       BOOLEAN DEFAULT FALSE,
			use_advanced_matching   BOOLEAN DEFAULT FALSE,
			json_path               TEXT,
			expected_value          TEXT,
			match_method            match_method,
			secret                  TEXT,

			-- Scheduling
			interval_ms             INTEGER NOT NULL DEFAULT 60000,
			is_active               BOOLEAN NOT NULL DEFAULT TRUE,

			-- Uptime tracking
			status_window           BOOLEAN[],
			status_window_size      INTEGER DEFAULT 5,
			status_window_threshold INTEGER DEFAULT 60,
			uptime_percentage       DOUBLE PRECISION,

			-- Infrastructure alert thresholds
			cpu_alert_threshold     INTEGER,
			cpu_alert_counter       INTEGER,
			memory_alert_threshold  INTEGER,
			memory_alert_counter    INTEGER,
			disk_alert_threshold    INTEGER,
			disk_alert_counter      INTEGER,
			temp_alert_threshold    INTEGER,
			temp_alert_counter      INTEGER,
			selected_disks          TEXT[],

			-- Game monitoring
			game_id                 TEXT,
			grpc_service_name       TEXT,

			-- Grouping
			monitor_group           TEXT,

			-- Geo checks
			geo_check_enabled       BOOLEAN DEFAULT FALSE,
			geo_check_locations     TEXT[],
			geo_check_interval_ms   INTEGER DEFAULT 300000,

			created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_monitors_team_type ON monitors (team_id, type);
		CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON monitors (user_id);
		CREATE INDEX IF NOT EXISTS idx_monitors_status ON monitors (status);
	`);
};

export const dropMonitors = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS monitors;`);
};
