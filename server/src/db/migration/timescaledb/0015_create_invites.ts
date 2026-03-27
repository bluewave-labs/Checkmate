import type { Pool } from "pg";

export const createInvites = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS invites (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email       TEXT NOT NULL UNIQUE,
			team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
			roles       user_role[] NOT NULL DEFAULT ARRAY['user']::user_role[],
			token       TEXT NOT NULL,
			expiry      TIMESTAMPTZ,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_invites_expiry ON invites (expiry);
	`);
};

export const dropInvites = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS invites;`);
};
