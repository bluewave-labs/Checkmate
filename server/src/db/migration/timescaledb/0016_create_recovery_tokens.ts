import type { Pool } from "pg";

export const createRecoveryTokens = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS recovery_tokens (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email       TEXT NOT NULL UNIQUE,
			token       TEXT NOT NULL,
			expiry      TIMESTAMPTZ,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_recovery_expiry ON recovery_tokens (expiry);
	`);
};

export const dropRecoveryTokens = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS recovery_tokens;`);
};
