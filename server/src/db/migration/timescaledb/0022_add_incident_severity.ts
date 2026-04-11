import type { Pool } from "pg";

export const addIncidentSeverity = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE incidents
		ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'none'
		CHECK (severity IN ('none', 'high', 'critical'));
	`);
};

export const dropIncidentSeverity = async (pool: Pool) => {
	await pool.query(`ALTER TABLE incidents DROP COLUMN IF EXISTS severity;`);
};
