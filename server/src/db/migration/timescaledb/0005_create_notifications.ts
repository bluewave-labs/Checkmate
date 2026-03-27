import type { Pool } from "pg";

export const createNotifications = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS notifications (
			id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id             UUID NOT NULL REFERENCES users(id),
			team_id             UUID NOT NULL REFERENCES teams(id),
			type                notification_type NOT NULL,
			notification_name   TEXT,
			address             TEXT,
			phone               TEXT,

			-- Matrix-specific fields
			homeserver_url      TEXT,
			room_id             TEXT,
			access_token        TEXT,

			created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS idx_notifications_team ON notifications (team_id);
		CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
	`);
};

export const dropNotifications = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS notifications;`);
};
