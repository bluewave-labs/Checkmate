import type { Pool } from "pg";
import type { IChecksRepository } from "@/repositories/checks/IChecksRepository.js";
import type {
	Check,
	CheckAudits,
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckNetworkInterfaceInfo,
	ChecksQueryResult,
	ChecksSummary,
	MonitorType,
	PageSpeedChecksResult,
	HardwareChecksResult,
	UptimeChecksResult,
	GotTimings,
} from "@/types/index.js";
import type { LatestChecksMap } from "@/repositories/checks/MongoChecksRepistory.js";
import { getDateForRange } from "@/utils/dataUtils.js";

// Map MongoDB dateString formats to TimescaleDB time_bucket intervals
const dateStringToBucket = (dateString: string): string => {
	if (dateString.includes("%M")) return "1 minute";
	if (dateString.includes("%H")) return "1 hour";
	return "1 day";
};

export class TimescaleChecksRepository implements IChecksRepository {
	constructor(private pool: Pool) {}

	// Returns the continuous aggregate table name for the given bucket interval and query type,
	// or null if no CA is available (fall back to raw checks table).
	private getCaTable(bucket: string, type: "uptime" | "hardware" | "pagespeed"): string | null {
		if (type === "uptime" && bucket === "1 hour") return "checks_hourly";
		if (type === "uptime" && bucket === "1 day") return "checks_daily";
		if (type === "hardware" && bucket === "1 hour") return "hardware_hourly";
		if (type === "pagespeed" && bucket === "1 day") return "pagespeed_daily";
		return null;
	}

	create = async (check: Check): Promise<Check> => {
		const row = await this.insertCheck(check);
		if (!row) {
			throw new Error("Failed to create check");
		}

		// Insert child records
		if (check.disk?.length) {
			await this.insertDisks(row.id, row.created_at, check.disk);
		}
		if (check.net?.length) {
			await this.insertNetworkInterfaces(row.id, row.created_at, check.net);
		}
		if (check.errors?.length) {
			await this.insertErrors(row.id, row.created_at, check.errors);
		}

		return this.toEntity(row, check.disk, check.errors, check.net);
	};

	createChecks = async (checks: Check[]): Promise<Check[]> => {
		const results: Check[] = [];
		for (const check of checks) {
			results.push(await this.create(check));
		}
		return results;
	};

	findByMonitorId = async (
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		filter: string | undefined,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined
	): Promise<ChecksQueryResult> => {
		const { conditions, values, paramIndex } = this.buildCheckFilters({ monitorId, dateRange, filter, status }, "monitor_id");

		const direction = sortOrder === "asc" ? "ASC" : "DESC";
		const offset = page && rowsPerPage ? page * rowsPerPage : 0;

		const [countResult, checksResult] = await Promise.all([
			this.pool.query(`SELECT COUNT(*)::int AS count FROM checks WHERE ${conditions.join(" AND ")}`, values),
			this.pool.query(
				`SELECT * FROM checks WHERE ${conditions.join(" AND ")} ORDER BY created_at ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
				[...values, rowsPerPage, offset]
			),
		]);

		return {
			checksCount: countResult.rows[0].count,
			checks: await this.populateChildData(checksResult.rows),
		};
	};

	findByTeamId = async (
		sortOrder: string,
		dateRange: string,
		filter: string | undefined,
		page: number,
		rowsPerPage: number,
		teamId: string
	): Promise<ChecksQueryResult> => {
		const { conditions, values, paramIndex } = this.buildCheckFilters({ teamId, dateRange, filter }, "team_id");

		const direction = sortOrder === "asc" ? "ASC" : "DESC";
		const offset = page && rowsPerPage ? page * rowsPerPage : 0;

		const [countResult, checksResult] = await Promise.all([
			this.pool.query(`SELECT COUNT(*)::int AS count FROM checks WHERE ${conditions.join(" AND ")}`, values),
			this.pool.query(
				`SELECT * FROM checks WHERE ${conditions.join(" AND ")} ORDER BY created_at ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
				[...values, rowsPerPage, offset]
			),
		]);

		return {
			checksCount: countResult.rows[0].count,
			checks: await this.populateChildData(checksResult.rows),
		};
	};

	findLatestByMonitorIds = async (monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap> => {
		if (!monitorIds.length) {
			return {};
		}
		const limitPerMonitor = options?.limitPerMonitor ?? 25;
		const dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);

		const allResult = await this.pool.query(
			`SELECT * FROM (
				SELECT *, ROW_NUMBER() OVER (PARTITION BY monitor_id ORDER BY created_at DESC) AS rn
				FROM checks
				WHERE monitor_id = ANY($1) AND created_at >= $2
			 ) sub
			 WHERE rn <= $3
			 ORDER BY monitor_id, created_at DESC`,
			[monitorIds, dateFilter, limitPerMonitor]
		);

		const checks = await this.populateChildData(allResult.rows);

		const mapped: LatestChecksMap = {};
		for (let i = 0; i < allResult.rows.length; i++) {
			const mid = allResult.rows[i].monitor_id;
			if (!mapped[mid]) {
				mapped[mid] = [];
			}
			const check = checks[i];
			if (check !== undefined) {
				mapped[mid].push(check);
			}
		}
		// Ensure all requested IDs have an entry
		for (const id of monitorIds) {
			if (!mapped[id]) {
				mapped[id] = [];
			}
		}
		return mapped;
	};

	findByDateRangeAndMonitorId = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string,
		options?: { type?: MonitorType }
	): Promise<UptimeChecksResult | HardwareChecksResult | PageSpeedChecksResult> => {
		if (options?.type === "hardware") {
			return this.findHardwareDateRangeChecks(monitorId, startDate, endDate, dateString);
		}
		if (options?.type === "pagespeed") {
			return this.findPageSpeedDateRangeChecks(monitorId, startDate, endDate, dateString);
		}
		return this.findUptimeDateRangeChecks(options?.type ?? "http", monitorId, startDate, endDate, dateString);
	};

	findSummaryByTeamId = async (teamId: string, dateRange: string): Promise<ChecksSummary> => {
		const rangeDate = getDateForRange(dateRange);
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];

		if (rangeDate) {
			conditions.push("created_at >= $2");
			values.push(rangeDate);
		}

		const result = await this.pool.query(
			`SELECT
				COUNT(*)::int AS "totalChecks",
				COUNT(*) FILTER (WHERE status = FALSE)::int AS "downChecks"
			 FROM checks WHERE ${conditions.join(" AND ")}`,
			values
		);

		return result.rows[0] ?? { totalChecks: 0, downChecks: 0 };
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM checks WHERE monitor_id = $1`, [monitorId]);
		return result.rowCount ?? 0;
	};

	deleteByTeamId = async (teamId: string): Promise<number> => {
		const result = await this.pool.query(`DELETE FROM checks WHERE team_id = $1`, [teamId]);
		return result.rowCount ?? 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		if (!monitorIds.length) {
			const result = await this.pool.query(`DELETE FROM checks`);
			return result.rowCount ?? 0;
		}
		const result = await this.pool.query(`DELETE FROM checks WHERE monitor_id != ALL($1)`, [monitorIds]);
		return result.rowCount ?? 0;
	};

	deleteOlderThan = async (date: Date): Promise<number> => {
		// TimescaleDB drop_chunks is O(1) per chunk, much faster than row-by-row DELETE
		const result = await this.pool.query(`DELETE FROM checks WHERE created_at < $1`, [date]);
		return result.rowCount ?? 0;
	};

	// --- Private helpers ---

	private populateChildData = async (checkRows: Record<string, unknown>[]): Promise<Check[]> => {
		if (!checkRows.length) return [];

		const checkIds = checkRows.map((r) => r.id as string);

		const [disksResult, netsResult, errsResult] = await Promise.all([
			this.pool.query(
				`SELECT check_id, device, mountpoint, total_bytes, free_bytes, used_bytes, usage_percent,
					total_inodes, free_inodes, used_inodes, inodes_usage_percent,
					read_bytes, write_bytes, read_time, write_time
				 FROM check_disks WHERE check_id = ANY($1)`,
				[checkIds]
			),
			this.pool.query(
				`SELECT check_id, name, bytes_sent, bytes_recv, packets_sent, packets_recv,
					err_in, err_out, drop_in, drop_out, fifo_in, fifo_out
				 FROM check_network_interfaces WHERE check_id = ANY($1)`,
				[checkIds]
			),
			this.pool.query(
				`SELECT check_id, metrics, error
				 FROM check_errors WHERE check_id = ANY($1)`,
				[checkIds]
			),
		]);

		const diskMap = new Map<string, CheckDiskInfo[]>();
		for (const d of disksResult.rows) {
			const key = d.check_id as string;
			if (!diskMap.has(key)) diskMap.set(key, []);
			diskMap.get(key)!.push({
				device: d.device,
				mountpoint: d.mountpoint,
				total_bytes: Number(d.total_bytes),
				free_bytes: Number(d.free_bytes),
				used_bytes: Number(d.used_bytes),
				usage_percent: d.usage_percent,
				total_inodes: Number(d.total_inodes),
				free_inodes: Number(d.free_inodes),
				used_inodes: Number(d.used_inodes),
				inodes_usage_percent: d.inodes_usage_percent,
				read_bytes: Number(d.read_bytes),
				write_bytes: Number(d.write_bytes),
				read_time: Number(d.read_time),
				write_time: Number(d.write_time),
			});
		}

		const netMap = new Map<string, CheckNetworkInterfaceInfo[]>();
		for (const n of netsResult.rows) {
			const key = n.check_id as string;
			if (!netMap.has(key)) netMap.set(key, []);
			netMap.get(key)!.push({
				name: n.name,
				bytes_sent: Number(n.bytes_sent),
				bytes_recv: Number(n.bytes_recv),
				packets_sent: Number(n.packets_sent),
				packets_recv: Number(n.packets_recv),
				err_in: Number(n.err_in),
				err_out: Number(n.err_out),
				drop_in: Number(n.drop_in),
				drop_out: Number(n.drop_out),
				fifo_in: Number(n.fifo_in),
				fifo_out: Number(n.fifo_out),
			});
		}

		const errMap = new Map<string, CheckErrorInfo[]>();
		for (const e of errsResult.rows) {
			const key = e.check_id as string;
			if (!errMap.has(key)) errMap.set(key, []);
			errMap.get(key)!.push({ metric: e.metrics ?? [], err: e.error ?? "" });
		}

		return checkRows.map((row) => {
			const id = row.id as string;
			return this.toEntity(row, diskMap.get(id) ?? [], errMap.get(id) ?? [], netMap.get(id) ?? []);
		});
	};

	private insertCheck = async (check: Check) => {
		const result = await this.pool.query(
			`INSERT INTO checks (
				monitor_id, team_id, monitor_type, status, response_time, status_code, message,
				timing_start, timing_socket, timing_lookup, timing_connect, timing_secure_connect,
				timing_upload, timing_response, timing_end,
				phase_wait, phase_dns, phase_tcp, phase_tls, phase_request, phase_first_byte, phase_download, phase_total,
				cpu_physical_core, cpu_logical_core, cpu_frequency, cpu_current_frequency, cpu_temperature,
				cpu_free_percent, cpu_usage_percent,
				mem_total_bytes, mem_available_bytes, mem_used_bytes, mem_usage_percent,
				host_os, host_platform, host_kernel_version, host_pretty_name,
				capture_version, capture_mode,
				lighthouse_performance, lighthouse_accessibility, lighthouse_best_practices, lighthouse_seo,
				audit_cls_score, audit_cls_value, audit_cls_display,
				audit_si_score, audit_si_value, audit_si_display,
				audit_fcp_score, audit_fcp_value, audit_fcp_display,
				audit_lcp_score, audit_lcp_value, audit_lcp_display,
				audit_tbt_score, audit_tbt_value, audit_tbt_display
			 ) VALUES (
				$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
				$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,
				$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59
			 ) RETURNING *`,
			[
				check.metadata.monitorId,
				check.metadata.teamId,
				check.metadata.type,
				check.status,
				check.responseTime,
				check.statusCode,
				check.message,
				check.timings?.start ?? null,
				check.timings?.socket ?? null,
				check.timings?.lookup ?? null,
				check.timings?.connect ?? null,
				check.timings?.secureConnect ?? null,
				check.timings?.upload ?? null,
				check.timings?.response ?? null,
				check.timings?.end ?? null,
				check.timings?.phases?.wait ?? null,
				check.timings?.phases?.dns ?? null,
				check.timings?.phases?.tcp ?? null,
				check.timings?.phases?.tls ?? null,
				check.timings?.phases?.request ?? null,
				check.timings?.phases?.firstByte ?? null,
				check.timings?.phases?.download ?? null,
				check.timings?.phases?.total ?? null,
				check.cpu?.physical_core ?? null,
				check.cpu?.logical_core ?? null,
				check.cpu?.frequency ?? null,
				check.cpu?.current_frequency ?? null,
				check.cpu?.temperature ?? null,
				check.cpu?.free_percent ?? null,
				check.cpu?.usage_percent ?? null,
				check.memory?.total_bytes ?? null,
				check.memory?.available_bytes ?? null,
				check.memory?.used_bytes ?? null,
				check.memory?.usage_percent ?? null,
				check.host?.os ?? null,
				check.host?.platform ?? null,
				check.host?.kernel_version ?? null,
				check.host?.pretty_name ?? null,
				check.capture?.version ?? null,
				check.capture?.mode ?? null,
				check.performance ?? null,
				check.accessibility ?? null,
				check.bestPractices ?? null,
				check.seo ?? null,
				check.audits?.cls?.score ?? null,
				check.audits?.cls?.numericValue ?? null,
				check.audits?.cls?.displayValue ?? null,
				check.audits?.si?.score ?? null,
				check.audits?.si?.numericValue ?? null,
				check.audits?.si?.displayValue ?? null,
				check.audits?.fcp?.score ?? null,
				check.audits?.fcp?.numericValue ?? null,
				check.audits?.fcp?.displayValue ?? null,
				check.audits?.lcp?.score ?? null,
				check.audits?.lcp?.numericValue ?? null,
				check.audits?.lcp?.displayValue ?? null,
				check.audits?.tbt?.score ?? null,
				check.audits?.tbt?.numericValue ?? null,
				check.audits?.tbt?.displayValue ?? null,
			]
		);
		return result.rows[0];
	};

	private insertDisks = async (checkId: string, checkCreatedAt: Date, disks: CheckDiskInfo[]) => {
		for (const disk of disks) {
			await this.pool.query(
				`INSERT INTO check_disks (check_id, check_created_at, device, mountpoint, total_bytes, free_bytes, used_bytes, usage_percent,
					total_inodes, free_inodes, used_inodes, inodes_usage_percent, read_bytes, write_bytes, read_time, write_time)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
				[
					checkId,
					checkCreatedAt,
					disk.device,
					disk.mountpoint,
					disk.total_bytes,
					disk.free_bytes,
					disk.used_bytes,
					disk.usage_percent,
					disk.total_inodes,
					disk.free_inodes,
					disk.used_inodes,
					disk.inodes_usage_percent,
					disk.read_bytes,
					disk.write_bytes,
					disk.read_time,
					disk.write_time,
				]
			);
		}
	};

	private insertNetworkInterfaces = async (checkId: string, checkCreatedAt: Date, nets: CheckNetworkInterfaceInfo[]) => {
		for (const net of nets) {
			await this.pool.query(
				`INSERT INTO check_network_interfaces (check_id, check_created_at, name, bytes_sent, bytes_recv, packets_sent, packets_recv,
					err_in, err_out, drop_in, drop_out, fifo_in, fifo_out)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
				[
					checkId,
					checkCreatedAt,
					net.name,
					net.bytes_sent,
					net.bytes_recv,
					net.packets_sent,
					net.packets_recv,
					net.err_in,
					net.err_out,
					net.drop_in,
					net.drop_out,
					net.fifo_in,
					net.fifo_out,
				]
			);
		}
	};

	private insertErrors = async (checkId: string, checkCreatedAt: Date, errors: CheckErrorInfo[]) => {
		for (const err of errors) {
			await this.pool.query(
				`INSERT INTO check_errors (check_id, check_created_at, metrics, error)
				 VALUES ($1,$2,$3,$4)`,
				[checkId, checkCreatedAt, err.metric, err.err]
			);
		}
	};

	private buildCheckFilters = (
		opts: { monitorId?: string; teamId?: string; dateRange?: string; filter?: string; status?: boolean },
		idColumn: string
	) => {
		const conditions: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		if (opts.monitorId) {
			conditions.push(`${idColumn} = $${paramIndex++}`);
			values.push(opts.monitorId);
		} else if (opts.teamId) {
			conditions.push(`${idColumn} = $${paramIndex++}`);
			values.push(opts.teamId);
		}

		if (opts.dateRange) {
			const rangeDate = getDateForRange(opts.dateRange);
			if (rangeDate) {
				conditions.push(`created_at >= $${paramIndex++}`);
				values.push(rangeDate);
			}
		}

		// Filter overwrites status (matching Mongo behavior where filter sets matchStage.status)
		let statusApplied = false;
		if (opts.filter !== undefined) {
			switch (opts.filter) {
				case "all":
					break;
				case "up":
					conditions.push(`status = TRUE`);
					statusApplied = true;
					break;
				case "down":
					conditions.push(`status = FALSE`);
					statusApplied = true;
					break;
				case "resolve":
					conditions.push(`status = FALSE`);
					conditions.push(`status_code = 5000`);
					statusApplied = true;
					break;
				default:
					break;
			}
		}

		if (!statusApplied && opts.status !== undefined) {
			conditions.push(`status = $${paramIndex++}`);
			values.push(opts.status);
		}

		return { conditions, values, paramIndex };
	};

	private findUptimeDateRangeChecks = async (
		monitorType: Exclude<MonitorType, "hardware" | "pagespeed">,
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string
	): Promise<UptimeChecksResult> => {
		const bucket = dateStringToBucket(dateString);
		const caTable = this.getCaTable(bucket, "uptime");

		if (caTable) {
			return this.findUptimeFromCa(monitorType, monitorId, startDate, endDate, caTable);
		}
		return this.findUptimeFromRaw(monitorType, monitorId, startDate, endDate, bucket);
	};

	private findUptimeFromCa = async (
		monitorType: Exclude<MonitorType, "hardware" | "pagespeed">,
		monitorId: string,
		startDate: Date,
		endDate: Date,
		caTable: string
	): Promise<UptimeChecksResult> => {
		const result = await this.pool.query(
			`SELECT bucket AS bucket_date, total_checks::int, up_checks::int, down_checks::int,
				avg_response_time, avg_up_response_time, avg_down_response_time
			 FROM ${caTable}
			 WHERE monitor_id = $1 AND bucket >= $2 AND bucket <= $3
			 ORDER BY bucket`,
			[monitorId, startDate, endDate]
		);

		let totalChecks = 0;
		let totalUp = 0;
		let weightedResponseTime = 0;

		const groupedChecks = result.rows.map((row) => {
			const count = Number(row.total_checks);
			const up = Number(row.up_checks);
			const avg = Number(row.avg_response_time ?? 0);
			totalChecks += count;
			totalUp += up;
			weightedResponseTime += avg * count;
			return {
				bucketDate: (row.bucket_date as Date).toISOString(),
				avgResponseTime: avg,
				totalChecks: count,
			};
		});

		const groupedUpChecks = result.rows
			.filter((row) => Number(row.up_checks) > 0)
			.map((row) => ({
				bucketDate: (row.bucket_date as Date).toISOString(),
				avgResponseTime: Number(row.avg_up_response_time ?? 0),
				totalChecks: Number(row.up_checks),
			}));

		const groupedDownChecks = result.rows
			.filter((row) => Number(row.down_checks) > 0)
			.map((row) => ({
				bucketDate: (row.bucket_date as Date).toISOString(),
				avgResponseTime: Number(row.avg_down_response_time ?? 0),
				totalChecks: Number(row.down_checks),
			}));

		return {
			monitorType,
			groupedChecks,
			groupedUpChecks,
			groupedDownChecks,
			uptimePercentage: totalChecks > 0 ? totalUp / totalChecks : 0,
			avgResponseTime: totalChecks > 0 ? weightedResponseTime / totalChecks : 0,
		};
	};

	private findUptimeFromRaw = async (
		monitorType: Exclude<MonitorType, "hardware" | "pagespeed">,
		monitorId: string,
		startDate: Date,
		endDate: Date,
		bucket: string
	): Promise<UptimeChecksResult> => {
		const [uptimeResult, groupedResult, upResult, downResult] = await Promise.all([
			this.pool.query(
				`SELECT
					COUNT(*) FILTER (WHERE status = TRUE) AS up_checks,
					COUNT(*) AS total_checks,
					AVG(response_time) AS avg_response_time
				 FROM checks WHERE monitor_id = $1 AND created_at >= $2 AND created_at <= $3`,
				[monitorId, startDate, endDate]
			),
			this.pool.query(
				`SELECT
					time_bucket($1::interval, created_at) AS bucket_date,
					AVG(response_time) AS "avgResponseTime",
					COUNT(*)::int AS "totalChecks"
				 FROM checks WHERE monitor_id = $2 AND created_at >= $3 AND created_at <= $4
				 GROUP BY bucket_date ORDER BY bucket_date`,
				[bucket, monitorId, startDate, endDate]
			),
			this.pool.query(
				`SELECT
					time_bucket($1::interval, created_at) AS bucket_date,
					AVG(response_time) AS "avgResponseTime",
					COUNT(*)::int AS "totalChecks"
				 FROM checks WHERE monitor_id = $2 AND created_at >= $3 AND created_at <= $4 AND status = TRUE
				 GROUP BY bucket_date ORDER BY bucket_date`,
				[bucket, monitorId, startDate, endDate]
			),
			this.pool.query(
				`SELECT
					time_bucket($1::interval, created_at) AS bucket_date,
					AVG(response_time) AS "avgResponseTime",
					COUNT(*)::int AS "totalChecks"
				 FROM checks WHERE monitor_id = $2 AND created_at >= $3 AND created_at <= $4 AND status = FALSE
				 GROUP BY bucket_date ORDER BY bucket_date`,
				[bucket, monitorId, startDate, endDate]
			),
		]);

		const stats = uptimeResult.rows[0];
		const totalChecks = Number(stats?.total_checks ?? 0);
		const upChecks = Number(stats?.up_checks ?? 0);

		const formatGrouped = (rows: Array<Record<string, unknown>>) =>
			rows.map((row) => ({
				bucketDate: (row.bucket_date as Date).toISOString(),
				avgResponseTime: Number(row.avgResponseTime ?? 0),
				totalChecks: Number(row.totalChecks ?? 0),
			}));

		return {
			monitorType,
			groupedChecks: formatGrouped(groupedResult.rows),
			groupedUpChecks: formatGrouped(upResult.rows),
			groupedDownChecks: formatGrouped(downResult.rows),
			uptimePercentage: totalChecks > 0 ? upChecks / totalChecks : 0,
			avgResponseTime: Number(stats?.avg_response_time ?? 0),
		};
	};

	private findHardwareDateRangeChecks = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string
	): Promise<HardwareChecksResult> => {
		const bucket = dateStringToBucket(dateString);
		const caTable = this.getCaTable(bucket, "hardware");

		// Build the metrics query: use hardware_hourly CA for cpu/mem when available,
		// but temperature always requires the raw table
		const metricsQuery = caTable
			? this.pool.query(
					`SELECT bucket AS bucket_date, avg_cpu, avg_memory
					 FROM ${caTable}
					 WHERE monitor_id = $1 AND bucket >= $2 AND bucket <= $3
					 ORDER BY bucket`,
					[monitorId, startDate, endDate]
				)
			: this.pool.query(
					`SELECT
						time_bucket($1::interval, created_at) AS bucket_date,
						AVG(cpu_usage_percent) AS avg_cpu,
						AVG(mem_usage_percent) AS avg_memory
					 FROM checks
					 WHERE monitor_id = $2 AND monitor_type = 'hardware' AND created_at >= $3 AND created_at <= $4
					 GROUP BY bucket_date ORDER BY bucket_date`,
					[bucket, monitorId, startDate, endDate]
				);

		// Temperature query always hits raw table (not in any CA)
		const tempQuery = this.pool.query(
			`WITH temp_avg AS (
				SELECT time_bucket($1::interval, c.created_at) AS bucket_date, idx, AVG(val) AS avg_val
				FROM checks c, unnest(c.cpu_temperature) WITH ORDINALITY AS t(val, idx)
				WHERE c.monitor_id = $2 AND c.monitor_type = 'hardware' AND c.created_at >= $3 AND c.created_at <= $4
				GROUP BY bucket_date, idx
			)
			SELECT bucket_date, array_agg(avg_val ORDER BY idx) AS avg_temperature
			FROM temp_avg
			GROUP BY bucket_date
			ORDER BY bucket_date`,
			[bucket, monitorId, startDate, endDate]
		);

		// Batched disk query across all buckets (eliminates N+1)
		const diskQuery = this.pool.query(
			`SELECT
				time_bucket($1::interval, d.check_created_at) AS bucket_date,
				d.device AS name,
				AVG(d.read_bytes) AS "readSpeed",
				AVG(d.write_bytes) AS "writeSpeed",
				AVG(d.total_bytes) AS "totalBytes",
				AVG(d.free_bytes) AS "freeBytes",
				AVG(d.usage_percent) AS "usagePercent"
			 FROM check_disks d
			 WHERE d.check_id IN (
				SELECT id FROM checks
				WHERE monitor_id = $2 AND monitor_type = 'hardware' AND created_at >= $3 AND created_at <= $4
			 )
			 GROUP BY bucket_date, d.device
			 ORDER BY bucket_date, d.device`,
			[bucket, monitorId, startDate, endDate]
		);

		// Batched network query across all buckets (eliminates N+1)
		const netQuery = this.pool.query(
			`WITH bounded AS (
				SELECT
					time_bucket($1::interval, c.created_at) AS bucket_date,
					n.name,
					FIRST_VALUE(n.bytes_sent) OVER w AS first_bytes_sent,
					LAST_VALUE(n.bytes_sent) OVER w AS last_bytes_sent,
					FIRST_VALUE(n.bytes_recv) OVER w AS first_bytes_recv,
					LAST_VALUE(n.bytes_recv) OVER w AS last_bytes_recv,
					FIRST_VALUE(n.packets_sent) OVER w AS first_packets_sent,
					LAST_VALUE(n.packets_sent) OVER w AS last_packets_sent,
					FIRST_VALUE(n.packets_recv) OVER w AS first_packets_recv,
					LAST_VALUE(n.packets_recv) OVER w AS last_packets_recv,
					FIRST_VALUE(n.err_in) OVER w AS first_err_in,
					LAST_VALUE(n.err_in) OVER w AS last_err_in,
					FIRST_VALUE(n.err_out) OVER w AS first_err_out,
					LAST_VALUE(n.err_out) OVER w AS last_err_out,
					FIRST_VALUE(n.drop_in) OVER w AS first_drop_in,
					LAST_VALUE(n.drop_in) OVER w AS last_drop_in,
					FIRST_VALUE(n.drop_out) OVER w AS first_drop_out,
					LAST_VALUE(n.drop_out) OVER w AS last_drop_out,
					FIRST_VALUE(n.fifo_in) OVER w AS first_fifo_in,
					LAST_VALUE(n.fifo_in) OVER w AS last_fifo_in,
					FIRST_VALUE(n.fifo_out) OVER w AS first_fifo_out,
					LAST_VALUE(n.fifo_out) OVER w AS last_fifo_out,
					FIRST_VALUE(c.created_at) OVER w AS first_time,
					LAST_VALUE(c.created_at) OVER w AS last_time
				FROM check_network_interfaces n
				JOIN checks c ON c.id = n.check_id
				WHERE c.monitor_id = $2 AND c.monitor_type = 'hardware'
					AND c.created_at >= $3 AND c.created_at <= $4
				WINDOW w AS (PARTITION BY time_bucket($1::interval, c.created_at), n.name
					ORDER BY c.created_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
			)
			SELECT DISTINCT ON (bucket_date, name) bucket_date, name,
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_bytes_sent - first_bytes_sent) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "bytesSentPerSecond",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_bytes_recv - first_bytes_recv) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaBytesRecv",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_packets_sent - first_packets_sent) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaPacketsSent",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_packets_recv - first_packets_recv) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaPacketsRecv",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_err_in - first_err_in) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaErrIn",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_err_out - first_err_out) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaErrOut",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_drop_in - first_drop_in) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaDropIn",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_drop_out - first_drop_out) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaDropOut",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_fifo_in - first_fifo_in) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaFifoIn",
				CASE WHEN EXTRACT(EPOCH FROM (last_time - first_time)) > 0
					THEN (last_fifo_out - first_fifo_out) / EXTRACT(EPOCH FROM (last_time - first_time))
					ELSE 0 END AS "deltaFifoOut"
			FROM bounded
			ORDER BY bucket_date, name`,
			[bucket, monitorId, startDate, endDate]
		);

		// Run all 5 queries in parallel
		const [totalResult, upResult, metricsResult, tempResult, diskResult, netResult] = await Promise.all([
			this.pool.query(
				`SELECT COUNT(*)::int AS count FROM checks
				 WHERE monitor_id = $1 AND monitor_type = 'hardware' AND created_at >= $2 AND created_at <= $3`,
				[monitorId, startDate, endDate]
			),
			this.pool.query(
				`SELECT COUNT(*)::int AS count FROM checks
				 WHERE monitor_id = $1 AND monitor_type = 'hardware' AND created_at >= $2 AND created_at <= $3 AND status = TRUE`,
				[monitorId, startDate, endDate]
			),
			metricsQuery,
			tempQuery,
			diskQuery,
			netQuery,
		]);

		// Group disk and net results by bucket date
		const disksByBucket = new Map<string, typeof diskResult.rows>();
		for (const row of diskResult.rows) {
			const key = (row.bucket_date as Date).toISOString();
			if (!disksByBucket.has(key)) disksByBucket.set(key, []);
			disksByBucket.get(key)!.push(row);
		}

		const netsByBucket = new Map<string, typeof netResult.rows>();
		for (const row of netResult.rows) {
			const key = (row.bucket_date as Date).toISOString();
			if (!netsByBucket.has(key)) netsByBucket.set(key, []);
			netsByBucket.get(key)!.push(row);
		}

		const tempByBucket = new Map<string, number[]>();
		for (const row of tempResult.rows) {
			const key = (row.bucket_date as Date).toISOString();
			tempByBucket.set(key, Array.isArray(row.avg_temperature) ? row.avg_temperature.map(Number) : []);
		}

		// Assemble checks array from metrics + disk/net maps
		const checks = metricsResult.rows.map((row) => {
			const bucketDate = (row.bucket_date as Date).toISOString();
			const disks = disksByBucket.get(bucketDate) ?? [];
			const nets = netsByBucket.get(bucketDate) ?? [];

			return {
				bucketDate,
				avgCpuUsage: Number(row.avg_cpu ?? 0),
				avgMemoryUsage: Number(row.avg_memory ?? 0),
				avgTemperature: tempByBucket.get(bucketDate) ?? [],
				disks: disks.map((d) => ({
					name: d.name ?? "",
					readSpeed: Number(d.readSpeed ?? 0),
					writeSpeed: Number(d.writeSpeed ?? 0),
					totalBytes: Number(d.totalBytes ?? 0),
					freeBytes: Number(d.freeBytes ?? 0),
					usagePercent: Number(d.usagePercent ?? 0),
				})),
				net: nets.map((n) => ({
					name: n.name ?? "",
					bytesSentPerSecond: Number(n.bytesSentPerSecond ?? 0),
					deltaBytesRecv: Number(n.deltaBytesRecv ?? 0),
					deltaPacketsSent: Number(n.deltaPacketsSent ?? 0),
					deltaPacketsRecv: Number(n.deltaPacketsRecv ?? 0),
					deltaErrIn: Number(n.deltaErrIn ?? 0),
					deltaErrOut: Number(n.deltaErrOut ?? 0),
					deltaDropIn: Number(n.deltaDropIn ?? 0),
					deltaDropOut: Number(n.deltaDropOut ?? 0),
					deltaFifoIn: Number(n.deltaFifoIn ?? 0),
					deltaFifoOut: Number(n.deltaFifoOut ?? 0),
				})),
			};
		});

		return {
			monitorType: "hardware" as const,
			aggregateData: { totalChecks: totalResult.rows[0].count },
			upChecks: { totalChecks: upResult.rows[0].count },
			checks,
		};
	};

	private findPageSpeedDateRangeChecks = async (
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateString: string
	): Promise<PageSpeedChecksResult> => {
		const bucket = dateStringToBucket(dateString);
		const caTable = this.getCaTable(bucket, "pagespeed");

		const result = caTable
			? await this.pool.query(
					`SELECT bucket AS bucket_date,
						avg_performance AS performance,
						avg_accessibility AS accessibility,
						avg_best_practices AS "bestPractices",
						avg_seo AS seo,
						sample_count::int AS "totalChecks"
					 FROM ${caTable}
					 WHERE monitor_id = $1 AND bucket >= $2 AND bucket <= $3
					 ORDER BY bucket`,
					[monitorId, startDate, endDate]
				)
			: await this.pool.query(
					`SELECT
						time_bucket($1::interval, created_at) AS bucket_date,
						AVG(lighthouse_performance) AS performance,
						AVG(lighthouse_accessibility) AS accessibility,
						AVG(lighthouse_best_practices) AS "bestPractices",
						AVG(lighthouse_seo) AS seo,
						COUNT(*)::int AS "totalChecks"
					 FROM checks
					 WHERE monitor_id = $2 AND monitor_type = 'pagespeed' AND created_at >= $3 AND created_at <= $4
					 GROUP BY bucket_date ORDER BY bucket_date`,
					[bucket, monitorId, startDate, endDate]
				);

		return {
			monitorType: "pagespeed" as const,
			groupedChecks: result.rows.map((row) => ({
				bucketDate: (row.bucket_date as Date).toISOString(),
				performance: Number(row.performance ?? 0),
				accessibility: Number(row.accessibility ?? 0),
				bestPractices: Number(row.bestPractices ?? 0),
				seo: Number(row.seo ?? 0),
				totalChecks: Number(row.totalChecks ?? 0),
			})),
		};
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private toEntity = (row: any, disk?: CheckDiskInfo[], errors?: CheckErrorInfo[], net?: CheckNetworkInterfaceInfo[]): Check => {
		const timings: GotTimings = {
			start: row.timing_start ?? 0,
			socket: row.timing_socket ?? 0,
			lookup: row.timing_lookup ?? 0,
			connect: row.timing_connect ?? 0,
			secureConnect: row.timing_secure_connect ?? 0,
			upload: row.timing_upload ?? 0,
			response: row.timing_response ?? 0,
			end: row.timing_end ?? 0,
			phases: {
				wait: row.phase_wait ?? 0,
				dns: row.phase_dns ?? 0,
				tcp: row.phase_tcp ?? 0,
				tls: row.phase_tls ?? 0,
				request: row.phase_request ?? 0,
				firstByte: row.phase_first_byte ?? 0,
				download: row.phase_download ?? 0,
				total: row.phase_total ?? 0,
			},
		};

		const cpu: CheckCpuInfo = {
			physical_core: row.cpu_physical_core ?? 0,
			logical_core: row.cpu_logical_core ?? 0,
			frequency: row.cpu_frequency ?? 0,
			current_frequency: row.cpu_current_frequency ?? 0,
			temperature: row.cpu_temperature ?? [],
			free_percent: row.cpu_free_percent ?? 0,
			usage_percent: row.cpu_usage_percent ?? 0,
		};

		const memory: CheckMemoryInfo = {
			total_bytes: Number(row.mem_total_bytes ?? 0),
			available_bytes: Number(row.mem_available_bytes ?? 0),
			used_bytes: Number(row.mem_used_bytes ?? 0),
			usage_percent: row.mem_usage_percent ?? 0,
		};

		const host: CheckHostInfo = {
			os: row.host_os ?? "",
			platform: row.host_platform ?? "",
			kernel_version: row.host_kernel_version ?? "",
			pretty_name: row.host_pretty_name ?? "",
		};

		const capture: CheckCaptureInfo = {
			version: row.capture_version ?? "",
			mode: row.capture_mode ?? "",
		};

		const audits: CheckAudits | undefined =
			row.audit_cls_score !== null
				? {
						cls: { score: row.audit_cls_score, numericValue: row.audit_cls_value, displayValue: row.audit_cls_display },
						si: { score: row.audit_si_score, numericValue: row.audit_si_value, displayValue: row.audit_si_display },
						fcp: { score: row.audit_fcp_score, numericValue: row.audit_fcp_value, displayValue: row.audit_fcp_display },
						lcp: { score: row.audit_lcp_score, numericValue: row.audit_lcp_value, displayValue: row.audit_lcp_display },
						tbt: { score: row.audit_tbt_score, numericValue: row.audit_tbt_value, displayValue: row.audit_tbt_display },
					}
				: undefined;

		return {
			id: row.id,
			metadata: {
				monitorId: row.monitor_id,
				teamId: row.team_id,
				type: row.monitor_type,
			},
			status: row.status ?? false,
			responseTime: row.response_time ?? 0,
			timings,
			statusCode: row.status_code ?? 0,
			message: row.message ?? "",
			cpu,
			memory,
			disk: disk ?? [],
			host,
			errors: errors ?? [],
			capture,
			net: net ?? [],
			accessibility: row.lighthouse_accessibility ?? undefined,
			bestPractices: row.lighthouse_best_practices ?? undefined,
			seo: row.lighthouse_seo ?? undefined,
			performance: row.lighthouse_performance ?? undefined,
			audits,
			createdAt: row.created_at.toISOString(),
			updatedAt: row.updated_at.toISOString(),
		};
	};
}
