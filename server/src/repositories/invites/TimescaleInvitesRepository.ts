import type { Pool } from "pg";
import crypto from "crypto";
import type { IInvitesRepository } from "@/repositories/invites/IInvitesRepository.js";
import type { Invite } from "@/types/invite.js";
import type { UserRole } from "@/types/user.js";
import { AppError } from "@/utils/AppError.js";

const parsePostgresArray = (value: unknown): UserRole[] => {
	if (typeof value !== "string") return [];
	const inner = value.replace(/^\{|\}$/g, "");
	if (inner === "") return [];
	return inner.split(",") as UserRole[];
};

interface InviteRow {
	id: string;
	email: string;
	team_id: string;
	roles: UserRole[];
	token: string;
	expiry: Date | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, email, team_id, roles, token, expiry, created_at, updated_at`;

export class TimescaleInvitesRepository implements IInvitesRepository {
	constructor(private pool: Pool) {}

	create = async (invite: Partial<Invite>): Promise<Invite> => {
		// Delete existing invites for this email
		await this.pool.query(`DELETE FROM invites WHERE email = $1`, [invite.email]);

		const token = crypto.randomBytes(32).toString("hex");
		const result = await this.pool.query<InviteRow>(
			`INSERT INTO invites (email, team_id, roles, token, expiry)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING ${COLUMNS}`,
			[invite.email, invite.teamId, invite.role ?? ["user"], token, invite.expiry ? new Date(invite.expiry) : null]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create invite", status: 500 });
		}
		return this.toEntity(row);
	};

	findByToken = async (token: string): Promise<Invite> => {
		const result = await this.pool.query<InviteRow>(`SELECT ${COLUMNS} FROM invites WHERE token = $1`, [token]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(row);
	};

	findByTokenAndDelete = async (token: string): Promise<Invite> => {
		const result = await this.pool.query<InviteRow>(`DELETE FROM invites WHERE token = $1 RETURNING ${COLUMNS}`, [token]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(row);
	};

	private toEntity = (row: InviteRow): Invite => ({
		id: row.id,
		email: row.email,
		teamId: row.team_id,
		role: Array.isArray(row.roles) ? row.roles : parsePostgresArray(row.roles),
		token: row.token,
		expiry: row.expiry ? row.expiry.toISOString() : new Date(0).toISOString(),
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
