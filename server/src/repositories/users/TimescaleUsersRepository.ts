import type { Pool } from "pg";
import { IUsersRepository } from "./IUsersRepository.js";
import type { User, UserRole } from "@/types/user.js";
import { GenerateAvatarImage } from "@/utils/imageProcessing.js";
import { ParseBoolean } from "@/utils/utils.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "TimescaleUsersRepository";

// pg returns custom enum arrays as strings like "{user,admin}" — parse to JS array
const parsePostgresArray = (value: unknown): UserRole[] => {
	if (typeof value !== "string") return [];
	const inner = value.replace(/^\{|\}$/g, "");
	if (inner === "") return [];
	return inner.split(",") as UserRole[];
};

interface UserRow {
	id: string;
	team_id: string;
	first_name: string;
	last_name: string;
	email: string;
	password: string;
	avatar_image: string | null;
	profile_image: Buffer | null;
	profile_image_content_type: string | null;
	is_active: boolean;
	is_verified: boolean;
	roles: UserRole[];
	check_ttl: number | null;
	created_at: Date;
	updated_at: Date;
}

export class TimescaleUsersRepository implements IUsersRepository {
	constructor(private pool: Pool) {}

	create = async (user: Partial<User>, imageFile?: Express.Multer.File | null): Promise<User> => {
		let avatarImage: string | undefined;
		let profileImage: Buffer | undefined;
		let profileImageContentType: string | undefined;

		if (imageFile) {
			profileImage = imageFile.buffer;
			profileImageContentType = imageFile.mimetype;
			avatarImage = await GenerateAvatarImage(imageFile);
		}

		const result = await this.pool.query<UserRow>(
			`INSERT INTO users (team_id, first_name, last_name, email, password, avatar_image, profile_image, profile_image_content_type, is_active, is_verified, roles, check_ttl)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			 RETURNING id, team_id, first_name, last_name, email, password, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at`,
			[
				user.teamId || null,
				user.firstName,
				user.lastName,
				user.email,
				user.password,
				avatarImage || null,
				profileImage || null,
				profileImageContentType || null,
				user.isActive ?? true,
				user.isVerified ?? false,
				user.role ?? ["user"],
				user.checkTTL ?? null,
			]
		);

		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create user", service: SERVICE_NAME, status: 500 });
		}
		const entity = this.toEntity(row);
		entity.password = "";
		return entity;
	};

	findByEmail = async (email: string): Promise<User> => {
		const result = await this.pool.query<UserRow>(
			`SELECT id, team_id, first_name, last_name, email, password, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at
			 FROM users WHERE email = $1`,
			[email]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(row);
	};

	findById = async (id: string): Promise<User> => {
		const result = await this.pool.query<UserRow>(
			`SELECT id, team_id, first_name, last_name, email, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at
			 FROM users WHERE id = $1`,
			[id]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(row);
	};

	findAll = async (): Promise<User[]> => {
		const result = await this.pool.query<UserRow>(
			`SELECT id, team_id, first_name, last_name, email, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at
			 FROM users`
		);
		return result.rows.map(this.toEntity);
	};

	updateById = async (id: string, patch: Partial<User & { deleteProfileImage?: boolean }>, file?: Express.Multer.File | null): Promise<User> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		if (ParseBoolean(patch.deleteProfileImage) === true) {
			sets.push(`profile_image = NULL`);
			sets.push(`profile_image_content_type = NULL`);
			sets.push(`avatar_image = NULL`);
		} else if (file) {
			const avatarImage = await GenerateAvatarImage(file);
			sets.push(`profile_image = $${paramIndex++}`);
			values.push(file.buffer);
			sets.push(`profile_image_content_type = $${paramIndex++}`);
			values.push(file.mimetype);
			sets.push(`avatar_image = $${paramIndex++}`);
			values.push(avatarImage);
		}

		if (patch.firstName !== undefined) {
			sets.push(`first_name = $${paramIndex++}`);
			values.push(patch.firstName);
		}
		if (patch.lastName !== undefined) {
			sets.push(`last_name = $${paramIndex++}`);
			values.push(patch.lastName);
		}
		if (patch.email !== undefined) {
			sets.push(`email = $${paramIndex++}`);
			values.push(patch.email);
		}
		if (patch.password !== undefined) {
			sets.push(`password = $${paramIndex++}`);
			values.push(patch.password);
		}
		if (patch.isActive !== undefined) {
			sets.push(`is_active = $${paramIndex++}`);
			values.push(patch.isActive);
		}
		if (patch.isVerified !== undefined) {
			sets.push(`is_verified = $${paramIndex++}`);
			values.push(patch.isVerified);
		}
		if (patch.role !== undefined) {
			sets.push(`roles = $${paramIndex++}`);
			values.push(patch.role);
		}
		if (patch.teamId !== undefined) {
			sets.push(`team_id = $${paramIndex++}`);
			values.push(patch.teamId);
		}
		if (patch.checkTTL !== undefined) {
			sets.push(`check_ttl = $${paramIndex++}`);
			values.push(patch.checkTTL);
		}

		if (sets.length === 0) {
			return this.findById(id);
		}

		sets.push(`updated_at = NOW()`);
		values.push(id);

		const result = await this.pool.query<UserRow>(
			`UPDATE users SET ${sets.join(", ")} WHERE id = $${paramIndex}
			 RETURNING id, team_id, first_name, last_name, email, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at`,
			values
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(row);
	};

	deleteById = async (id: string): Promise<User> => {
		const result = await this.pool.query<UserRow>(
			`DELETE FROM users WHERE id = $1
			 RETURNING id, team_id, first_name, last_name, email, password, avatar_image, is_active, is_verified, roles, check_ttl, created_at, updated_at`,
			[id]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "User not found", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(row);
	};

	findSuperAdmin = async (): Promise<boolean> => {
		const result = await this.pool.query(`SELECT 1 FROM users WHERE 'superadmin' = ANY(roles) LIMIT 1`);
		return (result.rowCount ?? 0) > 0;
	};

	private toEntity = (row: UserRow): User => ({
		id: row.id,
		firstName: row.first_name,
		lastName: row.last_name,
		email: row.email,
		password: row.password,
		avatarImage: row.avatar_image ?? undefined,
		profileImage: undefined,
		isActive: row.is_active,
		isVerified: row.is_verified,
		role: Array.isArray(row.roles) ? row.roles : parsePostgresArray(row.roles),
		teamId: row.team_id ?? "",
		checkTTL: row.check_ttl ?? undefined,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
