import type { Pool } from "pg";

export const addStrategyToMonitors = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE monitors
		ADD COLUMN IF NOT EXISTS strategy TEXT DEFAULT NULL;
	`);
};

export const dropStrategyFromMonitors = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE monitors
		DROP COLUMN IF EXISTS strategy;
	`);
};
