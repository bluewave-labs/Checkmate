import type { Pool } from "pg";
import type { IMonitorStatsRepository } from "./IMonitorStatsRepository.js";
import type { MonitorStats, CheckResultInput } from "@/types/monitorStats.js";
import { AppError } from "@/utils/AppError.js";

interface MonitorStatsRow {
	id: string;
	monitor_id: string;
	avg_response_time: number;
	max_response_time: number;
	total_checks: number;
	total_up_checks: number;
	total_down_checks: number;
	uptime_percentage: number;
	last_check_timestamp: Date | null;
	last_response_time: number;
	time_of_last_failure: Date | null;
	created_at: Date;
	updated_at: Date;
}

const COLUMNS = `id, monitor_id, avg_response_time, max_response_time, total_checks, total_up_checks,
	total_down_checks, uptime_percentage, last_check_timestamp, last_response_time, time_of_last_failure,
	created_at, updated_at`;

export class TimescaleMonitorStatsRepository implements IMonitorStatsRepository {
	constructor(private pool: Pool) {}

	create = async (data: Omit<MonitorStats, "id" | "createdAt" | "updatedAt">): Promise<MonitorStats> => {
		const result = await this.pool.query<MonitorStatsRow>(
			`INSERT INTO monitor_stats (monitor_id, avg_response_time, max_response_time, total_checks, total_up_checks,
				total_down_checks, uptime_percentage, last_check_timestamp, last_response_time, time_of_last_failure)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			 RETURNING ${COLUMNS}`,
			[
				data.monitorId,
				data.avgResponseTime,
				data.maxResponseTime,
				data.totalChecks,
				data.totalUpChecks,
				data.totalDownChecks,
				data.uptimePercentage,
				data.lastCheckTimestamp ? new Date(data.lastCheckTimestamp) : null,
				data.lastResponseTime,
				data.timeOfLastFailure ? new Date(data.timeOfLastFailure) : null,
			]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to create monitor stats", status: 500 });
		}
		return this.toEntity(row);
	};

	findByMonitorId = async (monitorId: string): Promise<MonitorStats> => {
		const result = await this.pool.query<MonitorStatsRow>(`SELECT ${COLUMNS} FROM monitor_stats WHERE monitor_id = $1`, [monitorId]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Monitor stats not found", status: 404 });
		}
		return this.toEntity(row);
	};

	updateByMonitorId = async (monitorId: string, result: CheckResultInput): Promise<MonitorStats> => {
		const { status, responseTime, now } = result;
		const upDelta = status ? 1 : 0;
		const downDelta = status ? 0 : 1;
		const nowTs = new Date(now);

		// Atomic upsert via INSERT ... ON CONFLICT DO UPDATE
		const queryResult = await this.pool.query<MonitorStatsRow>(
			`INSERT INTO monitor_stats (
				monitor_id,
				avg_response_time,
				max_response_time,
				total_checks,
				total_up_checks,
				total_down_checks,
				uptime_percentage,
				last_check_timestamp,
				last_response_time,
				time_of_last_failure
			) VALUES (
				$1,
				$2,
				$2,
				1,
				$3,
				$4,
				$3::float,
				$5,
				$2,
				CASE WHEN $6::boolean THEN $5 ELSE NULL END
			)
			ON CONFLICT (monitor_id) DO UPDATE SET
				total_checks      = monitor_stats.total_checks + 1,
				total_up_checks   = monitor_stats.total_up_checks + $3,
				total_down_checks = monitor_stats.total_down_checks + $4,
				avg_response_time = (monitor_stats.avg_response_time * monitor_stats.total_checks + $2)
				                    / (monitor_stats.total_checks + 1),
				uptime_percentage = (monitor_stats.total_up_checks + $3)::float
				                    / (monitor_stats.total_checks + 1),
				max_response_time = GREATEST(monitor_stats.max_response_time, $2),
				last_response_time = $2,
				last_check_timestamp = $5,
				time_of_last_failure = CASE
					WHEN $6::boolean AND monitor_stats.time_of_last_failure IS NULL THEN $5
					WHEN $6::boolean THEN monitor_stats.time_of_last_failure
					ELSE NULL
				END,
				updated_at = NOW()
			RETURNING ${COLUMNS}`,
			[monitorId, responseTime, upDelta, downDelta, nowTs, status]
		);
		const row = queryResult.rows[0];
		if (!row) {
			throw new AppError({ message: "Failed to apply check result to monitor stats", status: 500 });
		}
		return this.toEntity(row);
	};

	deleteByMonitorId = async (monitorId: string): Promise<MonitorStats> => {
		const result = await this.pool.query<MonitorStatsRow>(`DELETE FROM monitor_stats WHERE monitor_id = $1 RETURNING ${COLUMNS}`, [monitorId]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: "Monitor stats not found", status: 404 });
		}
		return this.toEntity(row);
	};

	deleteByMonitorIds = async (monitorIds: string[]): Promise<number> => {
		if (!monitorIds.length) {
			return 0;
		}
		const result = await this.pool.query(`DELETE FROM monitor_stats WHERE monitor_id = ANY($1)`, [monitorIds]);
		return result.rowCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		if (!monitorIds.length) {
			const result = await this.pool.query(`DELETE FROM monitor_stats`);
			return result.rowCount ?? 0;
		}
		const result = await this.pool.query(`DELETE FROM monitor_stats WHERE monitor_id != ALL($1)`, [monitorIds]);
		return result.rowCount ?? 0;
	};

	private toEntity = (row: MonitorStatsRow): MonitorStats => ({
		id: row.id,
		monitorId: row.monitor_id,
		avgResponseTime: row.avg_response_time,
		maxResponseTime: row.max_response_time,
		totalChecks: Number(row.total_checks),
		totalUpChecks: Number(row.total_up_checks),
		totalDownChecks: Number(row.total_down_checks),
		uptimePercentage: row.uptime_percentage,
		lastCheckTimestamp: row.last_check_timestamp ? row.last_check_timestamp.getTime() : 0,
		lastResponseTime: row.last_response_time,
		timeOfLastFailure: row.time_of_last_failure ? row.time_of_last_failure.getTime() : undefined,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
