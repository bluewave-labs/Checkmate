import type { Pool } from "pg";

export const createAuthFields = async (pool: Pool) => {
	await pool.query(`
		DO $$ BEGIN
			CREATE TYPE auth_type AS ENUM ('none', 'basic', 'bearer');
		EXCEPTION WHEN duplicate_object THEN NULL;
		END $$;
	`);

	await pool.query(`
		ALTER TABLE notifications ADD COLUMN IF NOT EXISTS auth_type auth_type;
		ALTER TABLE notifications ADD COLUMN IF NOT EXISTS username TEXT;
		ALTER TABLE notifications ADD COLUMN IF NOT EXISTS password TEXT;
	`);

	await pool.query(`
		ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ntfy';
	`);
};

export const dropAuthFields = async (pool: Pool) => {
	await pool.query(`
		ALTER TABLE notifications DROP COLUMN IF EXISTS auth_type;
		ALTER TABLE notifications DROP COLUMN IF EXISTS username;
		ALTER TABLE notifications DROP COLUMN IF EXISTS password;
	`);

	await pool.query(`DROP TYPE IF EXISTS auth_type;`);
};
