import type { Pool } from "pg";

export const addEscalationFields = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE incidents
			ADD COLUMN IF NOT EXISTS triggered_escalations TEXT[] NOT NULL DEFAULT '{}';

		ALTER TABLE monitors
			ADD COLUMN IF NOT EXISTS escalations JSONB NOT NULL DEFAULT '[]';
	`);
};

export const dropEscalationFields = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE incidents DROP COLUMN IF EXISTS triggered_escalations;
		ALTER TABLE monitors  DROP COLUMN IF EXISTS escalations;
	`);
};
