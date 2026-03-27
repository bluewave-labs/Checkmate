import type { Pool } from "pg";

export const createUsers = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS users (
			id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			team_id                     UUID REFERENCES teams(id) ON DELETE SET NULL,
			first_name                  TEXT NOT NULL,
			last_name                   TEXT NOT NULL,
			email                       TEXT NOT NULL UNIQUE,
			password                    TEXT NOT NULL,
			avatar_image                TEXT,
			profile_image               BYTEA,
			profile_image_content_type  TEXT,
			is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
			is_verified                 BOOLEAN NOT NULL DEFAULT FALSE,
			roles                       user_role[] NOT NULL DEFAULT ARRAY['user']::user_role[],
			check_ttl                   INTEGER,
			created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_users_team_id ON users (team_id);
		CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
	`);
};

export const dropUsers = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS users;`);
};
