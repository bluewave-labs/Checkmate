import type { Pool } from "pg";
import { INotificationsRepository } from "@/repositories/notifications/INotificationsRepository.js";
import type { Notification, NotificationChannel } from "@/types/notification.js";
import { AppError } from "@/utils/AppError.js";

interface NotificationRow {
	id: string;
	user_id: string;
	team_id: string;
	type: NotificationChannel;
	notification_name: string;
	address: string | null;
	phone: string | null;
	homeserver_url: string | null;
	room_id: string | null;
	access_token: string | null;
	account_sid: string | null;
	twilio_phone_number: string | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, user_id, team_id, type, notification_name, address, phone,
	homeserver_url, room_id, access_token, account_sid, twilio_phone_number, created_at, updated_at`;

export class TimescaleNotificationsRepository implements INotificationsRepository {
	constructor(private pool: Pool) {}

	create = async (data: Partial<Notification>): Promise<Notification> => {
		const result = await this.pool.query<NotificationRow>(
			`INSERT INTO notifications (user_id, team_id, type, notification_name, address, phone, homeserver_url, room_id, access_token, account_sid, twilio_phone_number)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			 RETURNING ${COLUMNS}`,
			[
				data.userId,
				data.teamId,
				data.type,
				data.notificationName,
				data.address ?? null,
				data.phone ?? null,
				data.homeserverUrl ?? null,
				data.roomId ?? null,
				data.accessToken ?? null,
				data.accountSid ?? null,
				data.twilioPhoneNumber ?? null,
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create notification", status: 500 });
		}
		return this.toEntity(row);
	};

	findById = async (id: string, teamId: string): Promise<Notification> => {
		const result = await this.pool.query<NotificationRow>(`SELECT ${COLUMNS} FROM notifications WHERE id = $1 AND team_id = $2`, [id, teamId]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Notification not found", status: 404 });
		}
		return this.toEntity(row);
	};

	findNotificationsByIds = async (ids: string[]): Promise<Notification[]> => {
		if (!ids.length) {
			return [];
		}
		const result = await this.pool.query<NotificationRow>(`SELECT ${COLUMNS} FROM notifications WHERE id = ANY($1)`, [ids]);
		return result.rows.map(this.toEntity);
	};

	findByTeamId = async (teamId: string): Promise<Notification[]> => {
		const result = await this.pool.query<NotificationRow>(`SELECT ${COLUMNS} FROM notifications WHERE team_id = $1`, [teamId]);
		return result.rows.map(this.toEntity);
	};

	updateById = async (id: string, teamId: string, patch: Partial<Notification>): Promise<Notification> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof Notification, string][] = [
			["type", "type"],
			["notificationName", "notification_name"],
			["address", "address"],
			["phone", "phone"],
			["homeserverUrl", "homeserver_url"],
			["roomId", "room_id"],
			["accessToken", "access_token"],
			["accountSid", "account_sid"],
			["twilioPhoneNumber", "twilio_phone_number"],
		];

		for (const [key, column] of fieldMap) {
			if (patch[key] !== undefined) {
				sets.push(`${column} = $${paramIndex++}`);
				values.push(patch[key]);
			}
		}

		if (sets.length === 0) {
			return this.findById(id, teamId);
		}

		sets.push(`updated_at = NOW()`);
		values.push(id, teamId);

		const result = await this.pool.query<NotificationRow>(
			`UPDATE notifications SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND team_id = $${paramIndex}
			 RETURNING ${COLUMNS}`,
			values
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Notification not found or could not be updated", status: 404 });
		}
		return this.toEntity(row);
	};

	deleteById = async (id: string, teamId: string): Promise<Notification> => {
		const result = await this.pool.query<NotificationRow>(`DELETE FROM notifications WHERE id = $1 AND team_id = $2 RETURNING ${COLUMNS}`, [
			id,
			teamId,
		]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Notification not found or could not be deleted", status: 404 });
		}
		return this.toEntity(row);
	};

	private toEntity = (row: NotificationRow): Notification => ({
		id: row.id,
		userId: row.user_id,
		teamId: row.team_id,
		type: row.type,
		notificationName: row.notification_name,
		address: row.address ?? undefined,
		phone: row.phone ?? undefined,
		homeserverUrl: row.homeserver_url ?? undefined,
		roomId: row.room_id ?? undefined,
		accessToken: row.access_token ?? undefined,
		accountSid: row.account_sid ?? undefined,
		twilioPhoneNumber: row.twilio_phone_number ?? undefined,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
