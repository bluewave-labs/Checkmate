import type { Pool } from "pg";

export const createEnums = async (pool: Pool) => {
	await pool.query(`
		DO $$ BEGIN
			CREATE TYPE monitor_type AS ENUM ('http', 'ping', 'pagespeed', 'hardware', 'docker', 'port', 'game', 'grpc', 'websocket', 'unknown');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE monitor_status AS ENUM ('up', 'down', 'paused', 'initializing', 'maintenance', 'breached');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE notification_type AS ENUM ('email', 'slack', 'discord', 'webhook', 'pager_duty', 'matrix', 'teams');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin', 'demo');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE incident_resolution_type AS ENUM ('automatic', 'manual');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE duration_unit AS ENUM ('seconds', 'minutes', 'hours', 'days');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE status_page_type AS ENUM ('uptime', 'infrastructure');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;

		DO $$ BEGIN
			CREATE TYPE match_method AS ENUM ('equal', 'include', 'regex');
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`);
};

export const dropEnums = async (pool: Pool) => {
	await pool.query(`
		DROP TYPE IF EXISTS match_method;
		DROP TYPE IF EXISTS status_page_type;
		DROP TYPE IF EXISTS duration_unit;
		DROP TYPE IF EXISTS incident_resolution_type;
		DROP TYPE IF EXISTS user_role;
		DROP TYPE IF EXISTS notification_type;
		DROP TYPE IF EXISTS monitor_status;
		DROP TYPE IF EXISTS monitor_type;
	`);
};
