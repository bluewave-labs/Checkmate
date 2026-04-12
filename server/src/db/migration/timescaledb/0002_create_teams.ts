import type { Pool } from "pg";

export const createTeams = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS teams (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email       TEXT NOT NULL UNIQUE,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_teams_email ON teams (email);
	`);
};

export const dropTeams = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS teams;`);
};
