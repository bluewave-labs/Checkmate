import type { Pool } from "pg";
import crypto from "crypto";
import type { IRecoveryTokensRepository } from "./IRecoveryTokensRepository.js";
import type { RecoveryToken } from "@/types/recoveryToken.js";
import { AppError } from "@/utils/AppError.js";

interface RecoveryTokenRow {
	id: string;
	email: string;
	token: string;
	expiry: Date | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, email, token, expiry, created_at, updated_at`;

export class TimescaleRecoveryTokensRepository implements IRecoveryTokensRepository {
	constructor(private pool: Pool) {}

	create = async (email: string): Promise<RecoveryToken> => {
		const token = crypto.randomBytes(32).toString("hex");
		const result = await this.pool.query<RecoveryTokenRow>(
			`INSERT INTO recovery_tokens (email, token)
			 VALUES ($1, $2)
			 ON CONFLICT (email) DO UPDATE SET token = $2, updated_at = NOW()
			 RETURNING ${COLUMNS}`,
			[email, token]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create recovery token", status: 500 });
		}
		return this.toEntity(row);
	};

	findByToken = async (token: string): Promise<RecoveryToken> => {
		const result = await this.pool.query<RecoveryTokenRow>(`SELECT ${COLUMNS} FROM recovery_tokens WHERE token = $1`, [token]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Recovery token not found", status: 404 });
		}
		return this.toEntity(row);
	};

	deleteManyByEmail = async (email: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM recovery_tokens WHERE email = $1`, [email]);
		return result.rowCount ?? 0;
	};

	private toEntity = (row: RecoveryTokenRow): RecoveryToken => ({
		id: row.id,
		email: row.email,
		token: row.token,
		expiry: row.expiry ? row.expiry.toISOString() : new Date(0).toISOString(),
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
