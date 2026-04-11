import type { Pool } from "pg";
import type { Incident, IncidentSummary, IncidentResolutionType } from "@/types/incident.js";
import type { IIncidentsRepository } from "@/repositories/incidents/IIncidentsRepository.js";
import { AppError } from "@/utils/AppError.js";

interface IncidentRow {
	id: string;
	monitor_id: string;
	team_id: string;
	start_time: Date;
	end_time: Date | null;
	status: boolean;
	message: string | null;
	status_code: number | null;
	resolution_type: IncidentResolutionType;
	resolved_by: string | null;
	resolved_by_email: string | null;
	comment: string | null;
	severity: "none" | "high" | "critical";
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, monitor_id, team_id, start_time, end_time, status, message, status_code,
	resolution_type, resolved_by, resolved_by_email, comment, severity, created_at, updated_at`;

export class TimescaleIncidentsRepository implements IIncidentsRepository {
	constructor(private pool: Pool) {}

	create = async (incident: Partial<Incident>): Promise<Incident> => {
		const result = await this.pool.query<IncidentRow>(
			`INSERT INTO incidents (monitor_id, team_id, start_time, end_time, status, message, status_code, resolution_type, resolved_by, resolved_by_email, comment, severity)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			 RETURNING ${COLUMNS}`,
			[
				incident.monitorId,
				incident.teamId,
				incident.startTime ? new Date(Number(incident.startTime) || incident.startTime) : new Date(),
				incident.endTime ? new Date(Number(incident.endTime) || incident.endTime) : null,
				incident.status ?? true,
				incident.message ?? null,
				incident.statusCode ?? null,
				incident.resolutionType ?? null,
				incident.resolvedBy ?? null,
				incident.resolvedByEmail ?? null,
				incident.comment ?? null,
				incident.severity ?? "none",
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create incident", status: 500 });
		}
		return this.toEntity(row);
	};

	findById = async (incidentId: string, teamId: string): Promise<Incident> => {
		const result = await this.pool.query<IncidentRow>(`SELECT ${COLUMNS} FROM incidents WHERE id = $1 AND team_id = $2`, [incidentId, teamId]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Incident with id ${incidentId} not found`, status: 404 });
		}
		return this.toEntity(row);
	};

	findActiveByIncidentId = async (incidentId: string, teamId: string): Promise<Incident | null> => {
		const result = await this.pool.query<IncidentRow>(`SELECT ${COLUMNS} FROM incidents WHERE id = $1 AND team_id = $2 AND status = TRUE`, [
			incidentId,
			teamId,
		]);
		const row = result.rows[0];
		return row ? this.toEntity(row) : null;
	};

	findActiveByMonitorId = async (monitorId: string, teamId: string): Promise<Incident | null> => {
		const result = await this.pool.query<IncidentRow>(`SELECT ${COLUMNS} FROM incidents WHERE monitor_id = $1 AND team_id = $2 AND status = TRUE`, [
			monitorId,
			teamId,
		]);
		const row = result.rows[0];
		return row ? this.toEntity(row) : null;
	};

	findByTeamId = async (
		teamId: string,
		startDate: Date | undefined,
		page: number,
		rowsPerPage: number,
		sortOrder?: string,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<Incident[]> => {
		const { conditions, values, paramIndex } = this.buildWhere(teamId, startDate, status, monitorId, resolutionType);
		const direction = sortOrder === "asc" ? "ASC" : "DESC";
		const offset = page * rowsPerPage;

		const result = await this.pool.query<IncidentRow>(
			`SELECT ${COLUMNS} FROM incidents
			 WHERE ${conditions.join(" AND ")}
			 ORDER BY created_at ${direction}
			 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
			[...values, rowsPerPage, offset]
		);
		return result.rows.map(this.toEntity);
	};

	countByTeamId = async (
		teamId: string,
		startDate: Date | undefined,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<number> => {
		const { conditions, values } = this.buildWhere(teamId, startDate, status, monitorId, resolutionType);
		const result = await this.pool.query(`SELECT COUNT(*)::int AS count FROM incidents WHERE ${conditions.join(" AND ")}`, values);
		return result.rows[0].count;
	};

	findSummaryByTeamId = async (teamId: string, limit?: number): Promise<IncidentSummary> => {
		// Counts by status and resolution type
		const countsResult = await this.pool.query(
			`SELECT
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE status = TRUE)::int AS active,
				COUNT(*) FILTER (WHERE resolution_type = 'manual')::int AS manual,
				COUNT(*) FILTER (WHERE resolution_type = 'automatic')::int AS automatic
			 FROM incidents WHERE team_id = $1`,
			[teamId]
		);
		const counts = countsResult.rows[0] ?? { total: 0, active: 0, manual: 0, automatic: 0 };

		// Average resolution time
		const resTimeResult = await this.pool.query(
			`SELECT AVG(EXTRACT(EPOCH FROM (end_time - start_time))) AS avg_seconds
			 FROM incidents
			 WHERE team_id = $1 AND status = FALSE AND end_time IS NOT NULL`,
			[teamId]
		);
		const avgSeconds = resTimeResult.rows[0]?.avg_seconds ?? 0;
		const avgResolutionTimeHours = Math.round((avgSeconds / 3600) * 100) / 100;

		// Top monitor by incident count
		const topMonitorResult = await this.pool.query(
			`SELECT i.monitor_id, m.name AS monitor_name, COUNT(*)::int AS count
			 FROM incidents i
			 LEFT JOIN monitors m ON m.id = i.monitor_id
			 WHERE i.team_id = $1
			 GROUP BY i.monitor_id, m.name
			 ORDER BY count DESC
			 LIMIT 1`,
			[teamId]
		);

		// Latest incidents
		const latestLimit = Math.max(1, Number.isFinite(Number(limit)) ? Number(limit) : 10);
		const latestResult = await this.pool.query(
			`SELECT i.id, i.monitor_id, m.name AS monitor_name, i.status, i.start_time, i.end_time,
				i.resolution_type, i.message, i.status_code, i.created_at
			 FROM incidents i
			 LEFT JOIN monitors m ON m.id = i.monitor_id
			 WHERE i.team_id = $1
			 ORDER BY i.created_at DESC
			 LIMIT $2`,
			[teamId, latestLimit]
		);

		const topRow = topMonitorResult.rows[0];

		return {
			total: counts.total,
			totalActive: counts.active,
			totalManualResolutions: counts.manual,
			totalAutomaticResolutions: counts.automatic,
			avgResolutionTimeHours,
			topMonitor: topRow
				? {
						monitorId: topRow.monitor_id,
						monitorName: topRow.monitor_name ?? null,
						incidentCount: topRow.count,
					}
				: null,
			latestIncidents: latestResult.rows.map((row) => ({
				id: row.id,
				monitorId: row.monitor_id,
				monitorName: row.monitor_name ?? null,
				status: row.status,
				startTime: row.start_time.toISOString(),
				endTime: row.end_time ? row.end_time.toISOString() : null,
				resolutionType: row.resolution_type ?? null,
				message: row.message ?? null,
				statusCode: row.status_code ?? null,
				createdAt: row.created_at.toISOString(),
			})),
		};
	};

	updateById = async (incidentId: string, teamId: string, patch: Partial<Incident>): Promise<Incident> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof Incident, string][] = [
			["status", "status"],
			["message", "message"],
			["statusCode", "status_code"],
			["endTime", "end_time"],
			["resolutionType", "resolution_type"],
			["resolvedBy", "resolved_by"],
			["resolvedByEmail", "resolved_by_email"],
			["comment", "comment"],
			["severity", "severity"],
		];

		for (const [key, column] of fieldMap) {
			if (patch[key] !== undefined) {
				const value = key === "endTime" && patch[key] ? new Date(Number(patch[key]) || (patch[key] as string)) : patch[key];
				sets.push(`${column} = $${paramIndex++}`);
				values.push(value);
			}
		}

		if (sets.length === 0) {
			return this.findById(incidentId, teamId);
		}

		sets.push(`updated_at = NOW()`);
		values.push(incidentId, teamId);

		const result = await this.pool.query<IncidentRow>(
			`UPDATE incidents SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND team_id = $${paramIndex}
			 RETURNING ${COLUMNS}`,
			values
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Failed to update incident with id ${incidentId}`, status: 500 });
		}
		return this.toEntity(row);
	};

	deleteByMonitorId = async (monitorId: string, teamId: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM incidents WHERE monitor_id = $1 AND team_id = $2`, [monitorId, teamId]);
		return result.rowCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		if (!monitorIds.length) {
			const result = await this.pool.query(`DELETE FROM incidents`);
			return result.rowCount ?? 0;
		}
		const result = await this.pool.query(`DELETE FROM incidents WHERE monitor_id != ALL($1)`, [monitorIds]);
		return result.rowCount ?? 0;
	};

	private buildWhere = (teamId: string, startDate: Date | undefined, status?: boolean, monitorId?: string, resolutionType?: string) => {
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];
		let paramIndex = 2;

		if (startDate) {
			conditions.push(`created_at >= $${paramIndex++}`);
			values.push(startDate);
		}
		if (status !== undefined) {
			conditions.push(`status = $${paramIndex++}`);
			values.push(status);
		}
		if (monitorId) {
			conditions.push(`monitor_id = $${paramIndex++}`);
			values.push(monitorId);
		}
		if (resolutionType) {
			conditions.push(`resolution_type = $${paramIndex++}`);
			values.push(resolutionType);
		}

		return { conditions, values, paramIndex };
	};

	private toEntity = (row: IncidentRow): Incident => ({
		id: row.id,
		monitorId: row.monitor_id,
		teamId: row.team_id,
		startTime: row.start_time.toISOString(),
		endTime: row.end_time ? row.end_time.toISOString() : null,
		status: row.status,
		message: row.message ?? null,
		statusCode: row.status_code ?? null,
		resolutionType: row.resolution_type ?? null,
		resolvedBy: row.resolved_by ?? null,
		resolvedByEmail: row.resolved_by_email ?? null,
		comment: row.comment ?? null,
		severity: row.severity ?? "none",
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
