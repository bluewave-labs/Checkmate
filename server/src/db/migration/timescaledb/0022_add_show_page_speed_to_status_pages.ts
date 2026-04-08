import type { Pool } from "pg";

export const addShowPageSpeedToStatusPages = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE status_pages
		ADD COLUMN IF NOT EXISTS show_page_speed BOOLEAN DEFAULT FALSE;
	`);
};

export const dropShowPageSpeedFromStatusPages = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE status_pages
		DROP COLUMN IF EXISTS show_page_speed;
	`);
};
