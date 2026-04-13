import type { Pool } from "pg";

export const addUserAgentFields = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE monitors
			ADD COLUMN IF NOT EXISTS custom_user_agent TEXT;

		ALTER TABLE app_settings
			ADD COLUMN IF NOT EXISTS default_user_agent TEXT;
	`);
};

export const dropUserAgentFields = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE monitors
			DROP COLUMN IF EXISTS custom_user_agent;

		ALTER TABLE app_settings
			DROP COLUMN IF EXISTS default_user_agent;
	`);
};
