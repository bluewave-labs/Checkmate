import type { Pool } from "pg";

export const createStatusPages = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS status_pages (
			id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id                 UUID NOT NULL REFERENCES users(id),
			team_id                 UUID NOT NULL REFERENCES teams(id),
			types                   status_page_type[] NOT NULL DEFAULT ARRAY['uptime']::status_page_type[],
			company_name            TEXT,
			url                     TEXT NOT NULL UNIQUE,
			timezone                TEXT,
			color                   TEXT DEFAULT '#4169E1',
			logo_data               BYTEA,
			logo_content_type       TEXT,
			is_published            BOOLEAN DEFAULT FALSE,
			show_charts             BOOLEAN DEFAULT FALSE,
			show_uptime_percentage  BOOLEAN DEFAULT FALSE,
			show_admin_login_link   BOOLEAN DEFAULT FALSE,
			show_infrastructure     BOOLEAN DEFAULT FALSE,
			custom_css              TEXT,
			created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_status_pages_team ON status_pages (team_id);
		CREATE INDEX IF NOT EXISTS idx_status_pages_url ON status_pages (url);

		CREATE TABLE IF NOT EXISTS status_page_monitors (
			status_page_id  UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
			monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
			sort_order      INTEGER DEFAULT 0,
			PRIMARY KEY (status_page_id, monitor_id)
		);

		CREATE TABLE IF NOT EXISTS status_page_sub_monitors (
			status_page_id  UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
			monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
			sort_order      INTEGER DEFAULT 0,
			PRIMARY KEY (status_page_id, monitor_id)
		);
	`);
};

export const dropStatusPages = async (pool: Pool) => {
	await pool.query(`
		DROP TABLE IF EXISTS status_page_sub_monitors;
		DROP TABLE IF EXISTS status_page_monitors;
		DROP TABLE IF EXISTS status_pages;
	`);
};
