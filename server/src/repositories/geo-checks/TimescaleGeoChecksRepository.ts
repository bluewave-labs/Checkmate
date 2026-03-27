import type { Pool } from "pg";
import type { IGeoChecksRepository, FlatGeoChecksQueryResult } from "./IGeoChecksRepository.js";
import type { GeoCheck, GeoCheckResult, GroupedGeoCheck, GeoContinent, FlatGeoCheck, MonitorType } from "@/types/index.js";
import { getDateForRange } from "@/utils/dataUtils.js";

const dateStringToBucket = (dateString: string): string => {
	if (dateString.includes("%M")) return "1 minute";
	if (dateString.includes("%H")) return "1 hour";
	return "1 day";
};

export class TimescaleGeoChecksRepository implements IGeoChecksRepository {
	constructor(private pool: Pool) {}

	createGeoChecks = async (geoChecks: Omit<GeoCheck, "id" | "__v" | "createdAt" | "updatedAt">[]): Promise<GeoCheck[]> => {
		const created: GeoCheck[] = [];

		for (const geoCheck of geoChecks) {
			const geoResult = await this.pool.query(
				`INSERT INTO geo_checks (monitor_id, team_id, monitor_type, expiry)
				 VALUES ($1, $2, $3, $4)
				 RETURNING id, monitor_id, team_id, monitor_type, expiry, created_at, updated_at`,
				[geoCheck.metadata.monitorId, geoCheck.metadata.teamId, geoCheck.metadata.type, geoCheck.expiry ? new Date(geoCheck.expiry) : null]
			);
			const row = geoResult.rows[0];
			if (!row) continue;

			for (const result of geoCheck.results) {
				await this.pool.query(
					`INSERT INTO geo_check_results (
						geo_check_id, geo_check_created_at,
						status, status_code,
						location_continent, location_region, location_country, location_state, location_city,
						location_longitude, location_latitude,
						timing_total, timing_dns, timing_tcp, timing_tls, timing_first_byte, timing_download
					 ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
					[
						row.id,
						row.created_at,
						result.status,
						result.statusCode,
						result.location.continent,
						result.location.region,
						result.location.country,
						result.location.state,
						result.location.city,
						result.location.longitude,
						result.location.latitude,
						result.timings.total,
						result.timings.dns,
						result.timings.tcp,
						result.timings.tls,
						result.timings.firstByte,
						result.timings.download,
					]
				);
			}

			created.push(this.toGeoCheck(row, geoCheck.results));
		}

		return created;
	};

	findByMonitorId = async (
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		page: number,
		rowsPerPage: number,
		continents?: GeoContinent[]
	): Promise<FlatGeoChecksQueryResult> => {
		const conditions: string[] = ["gc.monitor_id = $1"];
		const values: unknown[] = [monitorId];
		let paramIndex = 2;

		const rangeDate = getDateForRange(dateRange);
		if (rangeDate) {
			conditions.push(`gc.created_at >= $${paramIndex++}`);
			values.push(rangeDate);
		}

		if (continents && continents.length > 0) {
			conditions.push(`r.location_continent = ANY($${paramIndex++})`);
			values.push(continents);
		}

		const where = conditions.join(" AND ");
		const direction = sortOrder === "asc" ? "ASC" : "DESC";
		const offset = page && rowsPerPage ? page * rowsPerPage : 0;

		const countValues = [...values];
		const dataValues = [...values, rowsPerPage, offset];

		const [countResult, dataResult] = await Promise.all([
			this.pool.query(
				`SELECT COUNT(*)::int AS count
				 FROM geo_checks gc
				 JOIN geo_check_results r ON r.geo_check_id = gc.id
				 WHERE ${where}`,
				countValues
			),
			this.pool.query(
				`SELECT gc.id, gc.monitor_id, gc.team_id, gc.monitor_type,
					r.location_continent, r.location_region, r.location_country, r.location_state, r.location_city,
					r.location_longitude, r.location_latitude,
					r.status, r.status_code,
					r.timing_total, r.timing_dns, r.timing_tcp, r.timing_tls, r.timing_first_byte, r.timing_download,
					gc.created_at, gc.updated_at
				 FROM geo_checks gc
				 JOIN geo_check_results r ON r.geo_check_id = gc.id
				 WHERE ${where}
				 ORDER BY gc.created_at ${direction}
				 LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
				dataValues
			),
		]);

		const geoChecks: FlatGeoCheck[] = dataResult.rows.map((row) => ({
			id: `${row.monitor_id}-${new Date(row.created_at).getTime()}-${row.location_continent}-${row.location_city}-${row.id.substring(0, 8)}`,
			monitorId: row.monitor_id,
			teamId: row.team_id,
			type: row.monitor_type,
			location: {
				continent: row.location_continent,
				region: row.location_region,
				country: row.location_country,
				state: row.location_state,
				city: row.location_city,
				longitude: row.location_longitude,
				latitude: row.location_latitude,
			},
			status: row.status,
			statusCode: row.status_code,
			timings: {
				total: row.timing_total ?? 0,
				dns: row.timing_dns ?? 0,
				tcp: row.timing_tcp ?? 0,
				tls: row.timing_tls ?? 0,
				firstByte: row.timing_first_byte ?? 0,
				download: row.timing_download ?? 0,
			},
			createdAt: row.created_at.toISOString(),
			updatedAt: row.updated_at.toISOString(),
		}));

		return { geoChecksCount: countResult.rows[0].count, geoChecks };
	};

	findByMonitorIdAndDateRange = async (monitorId: string, startDate: Date, endDate: Date): Promise<GeoCheck[]> => {
		const geoRows = await this.pool.query(
			`SELECT id, monitor_id, team_id, monitor_type, expiry, created_at, updated_at
			 FROM geo_checks
			 WHERE monitor_id = $1 AND created_at >= $2 AND created_at <= $3
			 ORDER BY created_at DESC`,
			[monitorId, startDate, endDate]
		);

		const geoChecks: GeoCheck[] = [];
		for (const row of geoRows.rows) {
			const resultsRows = await this.pool.query(
				`SELECT status, status_code,
					location_continent, location_region, location_country, location_state, location_city,
					location_longitude, location_latitude,
					timing_total, timing_dns, timing_tcp, timing_tls, timing_first_byte, timing_download
				 FROM geo_check_results
				 WHERE geo_check_id = $1`,
				[row.id]
			);

			const results = resultsRows.rows.map(this.toGeoCheckResult);
			geoChecks.push(this.toGeoCheck(row, results));
		}

		return geoChecks;
	};

	findGroupedByMonitorIdAndDateRange = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateFormat: string,
		continents?: GeoContinent[]
	): Promise<GroupedGeoCheck[]> => {
		const bucket = dateStringToBucket(dateFormat);

		const conditions: string[] = ["gc.monitor_id = $2", "gc.created_at >= $3", "gc.created_at <= $4"];
		const values: unknown[] = [bucket, monitorId, startDate, endDate];
		let paramIndex = 5;

		if (continents && continents.length > 0) {
			conditions.push(`r.location_continent = ANY($${paramIndex++})`);
			values.push(continents);
		}

		const result = await this.pool.query(
			`SELECT
				time_bucket($1::interval, gc.created_at) AS bucket_date,
				r.location_continent AS continent,
				ROUND(AVG(r.timing_total)::numeric, 2) AS "avgResponseTime",
				COUNT(*)::int AS "totalChecks",
				ROUND((100.0 * COUNT(*) FILTER (WHERE r.status = TRUE) / COUNT(*))::numeric, 2) AS "uptimePercentage"
			 FROM geo_checks gc
			 JOIN geo_check_results r ON r.geo_check_id = gc.id
			 WHERE ${conditions.join(" AND ")}
			 GROUP BY bucket_date, r.location_continent
			 ORDER BY bucket_date, r.location_continent`,
			values
		);

		return result.rows.map((row) => ({
			bucketDate: (row.bucket_date as Date).toISOString(),
			continent: row.continent as GeoContinent,
			avgResponseTime: Number(row.avgResponseTime ?? 0),
			totalChecks: Number(row.totalChecks ?? 0),
			uptimePercentage: Number(row.uptimePercentage ?? 0),
		}));
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM geo_checks WHERE monitor_id = $1`, [monitorId]);
		return result.rowCount ?? 0;
	};

	deleteByTeamId = async (teamId: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM geo_checks WHERE team_id = $1`, [teamId]);
		return result.rowCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		if (!monitorIds.length) {
			const result = await this.pool.query(`DELETE FROM geo_checks`);
			return result.rowCount ?? 0;
		}
		const result = await this.pool.query(`DELETE FROM geo_checks WHERE monitor_id != ALL($1)`, [monitorIds]);
		return result.rowCount ?? 0;
	};

	private toGeoCheckResult = (row: Record<string, unknown>): GeoCheckResult => ({
		location: {
			continent: (row.location_continent as GeoContinent) ?? "",
			region: (row.location_region as string) ?? "",
			country: (row.location_country as string) ?? "",
			state: (row.location_state as string) ?? "",
			city: (row.location_city as string) ?? "",
			longitude: (row.location_longitude as number) ?? 0,
			latitude: (row.location_latitude as number) ?? 0,
		},
		status: (row.status as boolean) ?? false,
		statusCode: (row.status_code as number) ?? 0,
		timings: {
			total: (row.timing_total as number) ?? 0,
			dns: (row.timing_dns as number) ?? 0,
			tcp: (row.timing_tcp as number) ?? 0,
			tls: (row.timing_tls as number) ?? 0,
			firstByte: (row.timing_first_byte as number) ?? 0,
			download: (row.timing_download as number) ?? 0,
		},
	});

	private toGeoCheck = (row: Record<string, unknown>, results: GeoCheckResult[]): GeoCheck => ({
		id: row.id as string,
		metadata: {
			monitorId: row.monitor_id as string,
			teamId: row.team_id as string,
			type: row.monitor_type as MonitorType,
		},
		results,
		expiry: row.expiry ? (row.expiry as Date).toISOString() : new Date(0).toISOString(),
		__v: 0,
		createdAt: (row.created_at as Date).toISOString(),
		updatedAt: (row.updated_at as Date).toISOString(),
	});
}
