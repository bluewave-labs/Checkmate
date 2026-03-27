import type { Pool } from "pg";
import { ITeamsRepository } from "@/repositories/teams/ITeamsRepository.js";
import { Team } from "@/types/team.js";

export class TimescaleTeamsRepository implements ITeamsRepository {
	constructor(private pool: Pool) {}

	create = async (email: string): Promise<Team> => {
		const result = await this.pool.query(`INSERT INTO teams (email) VALUES ($1) RETURNING id, email, created_at, updated_at`, [email]);
		return this.toEntity(result.rows[0]);
	};

	findAllTeamIds = async (): Promise<string[]> => {
		const result = await this.pool.query(`SELECT id FROM teams`);
		return result.rows.map((row) => row.id);
	};

	private toEntity = (row: { id: string; email: string; created_at: Date; updated_at: Date }): Team => ({
		id: row.id,
		email: row.email,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
