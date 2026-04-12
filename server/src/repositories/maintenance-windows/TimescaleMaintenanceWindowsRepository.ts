import type { Pool } from "pg";
import type { IMaintenanceWindowsRepository } from "./IMaintenanceWindowsRepository.js";
import type { MaintenanceWindow, DurationUnit } from "@/types/maintenanceWindow.js";
import { AppError } from "@/utils/AppError.js";

interface MaintenanceWindowRow {
	id: string;
	monitor_id: string;
	team_id: string;
	active: boolean;
	name: string;
	duration: number;
	duration_unit: DurationUnit;
	repeat: number;
	start_time: Date;
	end_time: Date;
	expiry: Date | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, monitor_id, team_id, active, name, duration, duration_unit, repeat,
	start_time, end_time, expiry, created_at, updated_at`;

export class TimescaleMaintenanceWindowsRepository implements IMaintenanceWindowsRepository {
	constructor(private pool: Pool) {}

	create = async (data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> => {
		const startTime = data.start ? new Date(data.start) : null;
		const endTime = data.end ? new Date(data.end) : null;
		// One-time windows expire at end time
		const expiry = data.repeat === 0 ? endTime : null;

		const result = await this.pool.query<MaintenanceWindowRow>(
			`INSERT INTO maintenance_windows (monitor_id, team_id, active, name, duration, duration_unit, repeat, start_time, end_time, expiry)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 RETURNING ${COLUMNS}`,
			[
				data.monitorId,
				data.teamId,
				data.active ?? true,
				data.name ?? null,
				data.duration ?? null,
				data.durationUnit ?? null,
				data.repeat ?? 0,
				startTime,
				endTime,
				expiry,
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create maintenance window", status: 500 });
		}
		return this.toEntity(row);
	};

	findById = async (id: string, teamId: string): Promise<MaintenanceWindow> => {
		const result = await this.pool.query<MaintenanceWindowRow>(`SELECT ${COLUMNS} FROM maintenance_windows WHERE id = $1 AND team_id = $2`, [
			id,
			teamId,
		]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Maintenance Window not found", status: 404 });
		}
		return this.toEntity(row);
	};

	findByMonitorId = async (monitorId: string, teamId: string): Promise<MaintenanceWindow[]> => {
		const result = await this.pool.query<MaintenanceWindowRow>(`SELECT ${COLUMNS} FROM maintenance_windows WHERE monitor_id = $1 AND team_id = $2`, [
			monitorId,
			teamId,
		]);
		return result.rows.map(this.toEntity);
	};

	findByTeamId = async (
		teamId: string,
		page: number,
		rowsPerPage: number,
		field?: string,
		order?: string,
		active?: boolean
	): Promise<MaintenanceWindow[]> => {
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];
		let paramIndex = 2;

		if (active !== undefined) {
			conditions.push(`active = $${paramIndex++}`);
			values.push(active);
		}

		const fieldMap: Record<string, string> = {
			createdAt: "created_at",
			name: "name",
			start: "start_time",
			end: "end_time",
			active: "active",
		};
		const sortColumn = field ? (fieldMap[field] ?? "created_at") : "created_at";
		const sortDirection = order === "asc" ? "ASC" : "DESC";

		const offset = page && rowsPerPage ? page * rowsPerPage : 0;

		const result = await this.pool.query<MaintenanceWindowRow>(
			`SELECT ${COLUMNS} FROM maintenance_windows
			 WHERE ${conditions.join(" AND ")}
			 ORDER BY ${sortColumn} ${sortDirection}
			 LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
			[...values, rowsPerPage, offset]
		);
		return result.rows.map(this.toEntity);
	};

	updateById = async (id: string, teamId: string, patch: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof MaintenanceWindow, string, boolean][] = [
			["active", "active", false],
			["name", "name", false],
			["duration", "duration", false],
			["durationUnit", "duration_unit", false],
			["repeat", "repeat", false],
			["start", "start_time", true],
			["end", "end_time", true],
		];

		for (const [key, column, isDate] of fieldMap) {
			if (patch[key] !== undefined) {
				sets.push(`${column} = $${paramIndex++}`);
				values.push(isDate ? new Date(patch[key] as string) : patch[key]);
			}
		}

		if (sets.length === 0) {
			return this.findById(id, teamId);
		}

		sets.push(`updated_at = NOW()`);
		values.push(id, teamId);

		const result = await this.pool.query<MaintenanceWindowRow>(
			`UPDATE maintenance_windows SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND team_id = $${paramIndex}
			 RETURNING ${COLUMNS}`,
			values
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Maintenance window not found or could not be updated", status: 404 });
		}
		return this.toEntity(row);
	};

	deleteById = async (id: string, teamId: string): Promise<MaintenanceWindow> => {
		const result = await this.pool.query<MaintenanceWindowRow>(
			`DELETE FROM maintenance_windows WHERE id = $1 AND team_id = $2 RETURNING ${COLUMNS}`,
			[id, teamId]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Maintenance window not found or could not be deleted", status: 404 });
		}
		return this.toEntity(row);
	};

	countByTeamId = async (teamId: string, active?: boolean): Promise<number> => {
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];

		if (active !== undefined) {
			conditions.push(`active = $2`);
			values.push(active);
		}

		const result = await this.pool.query(`SELECT COUNT(*)::int AS count FROM maintenance_windows WHERE ${conditions.join(" AND ")}`, values);
		return result.rows[0].count;
	};

	private toEntity = (row: MaintenanceWindowRow): MaintenanceWindow => ({
		id: row.id,
		monitorId: row.monitor_id,
		teamId: row.team_id,
		active: row.active,
		name: row.name,
		duration: row.duration,
		durationUnit: row.duration_unit,
		repeat: row.repeat,
		start: row.start_time.toISOString(),
		end: row.end_time.toISOString(),
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
