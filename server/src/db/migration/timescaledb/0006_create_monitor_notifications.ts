import type { Pool } from "pg";

export const createMonitorNotifications = async (pool: Pool) => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS monitor_notifications (
			monitor_id      UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
			notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
			PRIMARY KEY (monitor_id, notification_id)
		);

		CREATE INDEX IF NOT EXISTS idx_monitor_notifications_notification
			ON monitor_notifications (notification_id);
	`);
};

export const dropMonitorNotifications = async (pool: Pool) => {
	await pool.query(`DROP TABLE IF EXISTS monitor_notifications;`);
};
