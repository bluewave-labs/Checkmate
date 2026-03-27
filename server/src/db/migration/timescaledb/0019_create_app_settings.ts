import type { Pool } from "pg";

export const createAppSettings = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS app_settings (
			id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			check_ttl                       INTEGER DEFAULT 30,
			language                        TEXT,
			jwt_secret                      TEXT,
			pagespeed_api_key               TEXT,

			-- SMTP / Email settings
			system_email_host               TEXT,
			system_email_port               INTEGER,
			system_email_address            TEXT,
			system_email_password           TEXT,
			system_email_user               TEXT,
			system_email_connection_host    TEXT,
			system_email_tls_servername     TEXT,
			system_email_secure             BOOLEAN,
			system_email_pool               BOOLEAN,
			system_email_ignore_tls         BOOLEAN,
			system_email_require_tls        BOOLEAN,
			system_email_reject_unauthorized BOOLEAN,

			show_url                        BOOLEAN,
			version                         TEXT,

			-- Global infrastructure thresholds
			threshold_cpu_usage             INTEGER,
			threshold_memory_usage          INTEGER,
			threshold_disk_usage            INTEGER,
			threshold_temperature           INTEGER,

			created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		-- Enforce singleton: only one row allowed
		CREATE OR REPLACE FUNCTION enforce_singleton_app_settings()
		RETURNS TRIGGER AS $$
		BEGIN
			IF (SELECT COUNT(*) FROM app_settings) >= 1 THEN
				RAISE EXCEPTION 'app_settings allows only one row';
			END IF;
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS trg_singleton_app_settings ON app_settings;
		CREATE TRIGGER trg_singleton_app_settings
			BEFORE INSERT ON app_settings
			FOR EACH ROW EXECUTE FUNCTION enforce_singleton_app_settings();
	`);
};

export const dropAppSettings = async (pool: Pool) => {
	await pool.query(`
		DROP TABLE IF EXISTS app_settings;
		DROP FUNCTION IF EXISTS enforce_singleton_app_settings();
	`);
};
