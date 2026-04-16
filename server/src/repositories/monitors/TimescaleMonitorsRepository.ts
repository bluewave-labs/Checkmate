import type { Pool } from "pg";
import type { Monitor, MonitorsSummary, MonitorStatus, MonitorType, MonitorMatchMethod, GeoContinent, PageSpeedStrategy } from "@/types/monitor.js";

import type { IMonitorsRepository, TeamQueryConfig, SummaryConfig } from "./IMonitorsRepository.js";
import { AppError } from "@/utils/AppError.js";

interface MonitorRow {
	id: string;
	user_id: string;
	team_id: string;
	name: string;
	description: string | null;
	type: MonitorType;
	status: MonitorStatus;
	url: string | null;
	port: number | null;
	ignore_tls_errors: boolean;
	use_advanced_matching: boolean;
	json_path: string | null;
	expected_value: string | null;
	match_method: MonitorMatchMethod | null;
	secret: string | null;
	interval_ms: number;
	is_active: boolean;
	status_window: boolean[] | null;
	status_window_size: number;
	status_window_threshold: number;
	uptime_percentage: number | null;
	cpu_alert_threshold: number;
	cpu_alert_counter: number;
	memory_alert_threshold: number;
	memory_alert_counter: number;
	disk_alert_threshold: number;
	disk_alert_counter: number;
	temp_alert_threshold: number;
	temp_alert_counter: number;
	selected_disks: string[] | null;
	game_id: string | null;
	grpc_service_name: string | null;
	strategy: PageSpeedStrategy | null;
	monitor_group: string | null;
	geo_check_enabled: boolean;
	geo_check_locations: GeoContinent[] | null;
	geo_check_interval_ms: number;
	created_at: Date;
	updated_at: Date;
}

const MONITOR_COLUMNS = `id, user_id, team_id, name, description, type, status, url, port,
	ignore_tls_errors, use_advanced_matching, json_path, expected_value, match_method, secret,
	interval_ms, is_active, status_window, status_window_size, status_window_threshold, uptime_percentage,
	cpu_alert_threshold, cpu_alert_counter, memory_alert_threshold, memory_alert_counter,
	disk_alert_threshold, disk_alert_counter, temp_alert_threshold, temp_alert_counter, selected_disks,
	game_id, grpc_service_name, strategy, monitor_group, geo_check_enabled, geo_check_locations, geo_check_interval_ms,
	created_at, updated_at`;

export class TimescaleMonitorsRepository implements IMonitorsRepository {
	constructor(private pool: Pool) {}

	create = async (monitor: Monitor, teamId: string, userId: string): Promise<Monitor | null> => {
		const result = await this.pool.query<MonitorRow>(
			`INSERT INTO monitors (user_id, team_id, name, description, type, status, url, port,
				ignore_tls_errors, use_advanced_matching, json_path, expected_value, match_method, secret,
				interval_ms, is_active, status_window, status_window_size, status_window_threshold,
				cpu_alert_threshold, cpu_alert_counter, memory_alert_threshold, memory_alert_counter,
				disk_alert_threshold, disk_alert_counter, temp_alert_threshold, temp_alert_counter, selected_disks,
				game_id, grpc_service_name, strategy, monitor_group, geo_check_enabled, geo_check_locations, geo_check_interval_ms)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)
			 RETURNING ${MONITOR_COLUMNS}`,
			[
				userId,
				teamId,
				monitor.name,
				monitor.description ?? null,
				monitor.type,
				monitor.status ?? "initializing",
				monitor.url ?? null,
				monitor.port ?? null,
				monitor.ignoreTlsErrors ?? false,
				monitor.useAdvancedMatching ?? false,
				monitor.jsonPath ?? null,
				monitor.expectedValue ?? null,
				monitor.matchMethod || null,
				monitor.secret ?? null,
				monitor.interval ?? 60000,
				monitor.isActive ?? true,
				monitor.statusWindow ?? null,
				monitor.statusWindowSize ?? 5,
				monitor.statusWindowThreshold ?? 60,
				monitor.cpuAlertThreshold ?? 0,
				monitor.cpuAlertCounter ?? 0,
				monitor.memoryAlertThreshold ?? 0,
				monitor.memoryAlertCounter ?? 0,
				monitor.diskAlertThreshold ?? 0,
				monitor.diskAlertCounter ?? 0,
				monitor.tempAlertThreshold ?? 0,
				monitor.tempAlertCounter ?? 0,
				monitor.selectedDisks ?? [],
				monitor.gameId ?? null,
				monitor.grpcServiceName ?? null,
				monitor.strategy ?? null,
				monitor.group ?? null,
				monitor.geoCheckEnabled ?? false,
				monitor.geoCheckLocations ?? [],
				monitor.geoCheckInterval ?? 300000,
			]
		);
		const row = result.rows[0];
		if (!row) {
			return null;
		}

		// Insert notification associations
		if (monitor.notifications?.length) {
			for (const notificationId of monitor.notifications) {
				await this.pool.query(`INSERT INTO monitor_notifications (monitor_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
					row.id,
					notificationId,
				]);
			}
		}

		const entity = this.toEntity(row);
		entity.notifications = monitor.notifications ?? [];
		return entity;
	};

	createMonitors = async (monitors: Monitor[]): Promise<Monitor[]> => {
		if (!monitors.length) {
			return [];
		}
		const created: Monitor[] = [];
		for (const monitor of monitors) {
			const result = await this.create(monitor, monitor.teamId, monitor.userId);
			if (result) {
				created.push(result);
			}
		}
		return created;
	};

	findById = async (monitorId: string, teamId: string): Promise<Monitor> => {
		const result = await this.pool.query<MonitorRow>(`SELECT ${MONITOR_COLUMNS} FROM monitors WHERE id = $1 AND team_id = $2`, [monitorId, teamId]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found`, status: 404 });
		}
		const monitor = this.toEntity(row);

		// Populate latest check with child data
		const checkResult = await this.pool.query(`SELECT * FROM checks WHERE monitor_id = $1 ORDER BY created_at DESC LIMIT 1`, [monitorId]);
		if (checkResult.rows[0]) {
			const checkRow = checkResult.rows[0];
			const childData = await this.fetchCheckChildData(checkRow.id);
			monitor.recentChecks = [this.toCheckSnapshot(checkRow, childData)];
		}

		// Populate notifications
		monitor.notifications = await this.fetchNotificationIds([monitorId]).then((m) => m.get(monitorId) ?? []);

		return monitor;
	};

	findAll = async (): Promise<Monitor[]> => {
		const result = await this.pool.query<MonitorRow>(`SELECT ${MONITOR_COLUMNS} FROM monitors`);
		const monitors = result.rows.map(this.toEntity);
		if (monitors.length > 0) {
			const notifMap = await this.fetchNotificationIds(monitors.map((m) => m.id));
			for (const monitor of monitors) {
				monitor.notifications = notifMap.get(monitor.id) ?? [];
			}
		}
		return monitors;
	};

	findByTeamId = async (teamId: string, config: TeamQueryConfig): Promise<Monitor[] | null> => {
		const { page = 0, rowsPerPage = 0, filter, field = "createdAt", order = "desc", type } = config ?? {};

		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];
		let paramIndex = 2;

		if (type !== undefined) {
			if (Array.isArray(type)) {
				conditions.push(`type = ANY($${paramIndex++})`);
				values.push(type);
			} else {
				conditions.push(`type = $${paramIndex++}`);
				values.push(type);
			}
		}

		if (filter !== undefined) {
			switch (field) {
				case "name":
					conditions.push(`(name ILIKE $${paramIndex} OR url ILIKE $${paramIndex})`);
					values.push(`%${filter}%`);
					paramIndex++;
					break;
				case "isActive":
					conditions.push(`is_active = $${paramIndex++}`);
					values.push(filter === "true");
					break;
				case "status":
					conditions.push(`status = $${paramIndex++}`);
					values.push(filter);
					break;
				case "type":
					conditions.push(`type = $${paramIndex++}`);
					values.push(filter);
					break;
				default:
					break;
			}
		}

		const fieldMap: Record<string, string> = {
			createdAt: "created_at",
			name: "name",
			status: "status",
			type: "type",
			isActive: "is_active",
		};
		const sortColumn = fieldMap[field] ?? "created_at";
		const sortDirection = order === "asc" ? "ASC" : "DESC";

		let query = `SELECT ${MONITOR_COLUMNS} FROM monitors WHERE ${conditions.join(" AND ")} ORDER BY ${sortColumn} ${sortDirection}`;

		if (rowsPerPage > 0) {
			const offset = Math.max(page, 0) * rowsPerPage;
			query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
			values.push(rowsPerPage, offset);
		}

		const result = await this.pool.query<MonitorRow>(query, values);
		const monitors = result.rows.map(this.toEntity);

		if (monitors.length === 0) return monitors;

		// Populate recentChecks — 25 latest checks per monitor in a single query
		const monitorIds = monitors.map((m) => m.id);
		const checksResult = await this.pool.query(
			`SELECT * FROM (
				SELECT *, ROW_NUMBER() OVER (PARTITION BY monitor_id ORDER BY created_at DESC) AS rn
				FROM checks
				WHERE monitor_id = ANY($1)
			 ) sub WHERE rn <= 25
			 ORDER BY monitor_id, created_at ASC`,
			[monitorIds]
		);

		// Group checks by monitor_id
		const checksMap = new Map<string, typeof checksResult.rows>();
		for (const row of checksResult.rows) {
			if (!checksMap.has(row.monitor_id)) checksMap.set(row.monitor_id, []);
			checksMap.get(row.monitor_id)!.push(row);
		}

		// Batch fetch child data for all checks in 3 queries
		const checkIds = checksResult.rows.map((r) => r.id);
		const diskMap = new Map<string, Record<string, unknown>[]>();
		const netMap = new Map<string, Record<string, unknown>[]>();
		const errorsMap = new Map<string, Record<string, unknown>[]>();

		if (checkIds.length > 0) {
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

			for (const d of disksResult.rows) {
				const key = d.check_id as string;
				if (!diskMap.has(key)) diskMap.set(key, []);
				diskMap.get(key)!.push(d);
			}
			for (const n of netsResult.rows) {
				const key = n.check_id as string;
				if (!netMap.has(key)) netMap.set(key, []);
				netMap.get(key)!.push(n);
			}
			for (const e of errsResult.rows) {
				const key = e.check_id as string;
				if (!errorsMap.has(key)) errorsMap.set(key, []);
				errorsMap.get(key)!.push(e);
			}
		}

		for (const monitor of monitors) {
			const rows = checksMap.get(monitor.id) ?? [];
			monitor.recentChecks = rows.map((row) => {
				const childData = {
					disk: (diskMap.get(row.id) ?? []).map((d) => ({
						device: d.device,
						mountpoint: d.mountpoint,
						total_bytes: Number(d.total_bytes),
						free_bytes: Number(d.free_bytes),
						used_bytes: Number(d.used_bytes),
						usage_percent: d.usage_percent as number,
						total_inodes: Number(d.total_inodes),
						free_inodes: Number(d.free_inodes),
						used_inodes: Number(d.used_inodes),
						inodes_usage_percent: d.inodes_usage_percent as number,
						read_bytes: Number(d.read_bytes),
						write_bytes: Number(d.write_bytes),
						read_time: Number(d.read_time),
						write_time: Number(d.write_time),
					})),
					net: (netMap.get(row.id) ?? []).map((n) => ({
						name: n.name as string,
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
					})),
					errors: (errorsMap.get(row.id) ?? []).map((e) => ({
						metric: (e.metrics as string[]) ?? [],
						err: (e.error as string) ?? "",
					})),
				};
				return this.toCheckSnapshot(row, childData);
			});
		}

		// Populate notifications in batch
		const notifMap = await this.fetchNotificationIds(monitorIds);
		for (const monitor of monitors) {
			monitor.notifications = notifMap.get(monitor.id) ?? [];
		}

		return monitors;
	};

	findByIds = async (monitorIds: string[]): Promise<Monitor[]> => {
		if (!monitorIds.length) {
			return [];
		}
		const result = await this.pool.query<MonitorRow>(`SELECT ${MONITOR_COLUMNS} FROM monitors WHERE id = ANY($1)`, [monitorIds]);
		const monitors = result.rows.map(this.toEntity);
		const notifMap = await this.fetchNotificationIds(monitorIds);
		for (const monitor of monitors) {
			monitor.notifications = notifMap.get(monitor.id) ?? [];
		}
		return monitors;
	};

	findByIdsWithChecks = async (monitorIds: string[], checksCount: number = 25): Promise<Monitor[]> => {
		if (!monitorIds.length) {
			return [];
		}
		const monitors = await this.findByIds(monitorIds);

		for (const monitor of monitors) {
			const checksResult = await this.pool.query(
				`SELECT * FROM checks
				 WHERE monitor_id = $1
				 ORDER BY created_at DESC
				 LIMIT $2`,
				[monitor.id, checksCount]
			);
			monitor.recentChecks = await Promise.all(
				checksResult.rows.map(async (row) => {
					// Fetch child records for hardware monitors
					let disk: import("@/types/index.js").CheckDiskInfo[] = [];
					let net: import("@/types/index.js").CheckNetworkInterfaceInfo[] = [];
					let errors: import("@/types/index.js").CheckErrorInfo[] = [];

					if (monitor.type === "hardware") {
						const [diskResult, netResult, errorsResult] = await Promise.all([
							this.pool.query(
								`SELECT device, mountpoint, total_bytes, free_bytes, used_bytes, usage_percent,
									total_inodes, free_inodes, used_inodes, inodes_usage_percent,
									read_bytes, write_bytes, read_time, write_time
								 FROM check_disks WHERE check_id = $1`,
								[row.id]
							),
							this.pool.query(
								`SELECT name, bytes_sent, bytes_recv, packets_sent, packets_recv,
									err_in, err_out, drop_in, drop_out, fifo_in, fifo_out
								 FROM check_network_interfaces WHERE check_id = $1`,
								[row.id]
							),
							this.pool.query(`SELECT metrics, error FROM check_errors WHERE check_id = $1`, [row.id]),
						]);
						disk = diskResult.rows.map((d) => ({
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
						}));
						net = netResult.rows.map((n) => ({
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
						}));
						errors = errorsResult.rows.map((e) => ({ metric: e.metrics ?? [], err: e.error ?? "" }));
					}

					return {
						id: row.id,
						status: row.status,
						responseTime: row.response_time ?? 0,
						statusCode: row.status_code ?? 0,
						message: row.message ?? "",
						timings:
							row.timing_start !== null
								? {
										start: row.timing_start,
										socket: row.timing_socket,
										lookup: row.timing_lookup,
										connect: row.timing_connect,
										secureConnect: row.timing_secure_connect,
										upload: row.timing_upload,
										response: row.timing_response,
										end: row.timing_end,
										phases: {
											wait: row.phase_wait,
											dns: row.phase_dns,
											tcp: row.phase_tcp,
											tls: row.phase_tls,
											request: row.phase_request,
											firstByte: row.phase_first_byte,
											download: row.phase_download,
											total: row.phase_total,
										},
									}
								: undefined,
						cpu:
							row.cpu_usage_percent !== null
								? {
										physical_core: row.cpu_physical_core,
										logical_core: row.cpu_logical_core,
										frequency: row.cpu_frequency,
										current_frequency: row.cpu_current_frequency,
										temperature: row.cpu_temperature ?? [],
										free_percent: row.cpu_free_percent,
										usage_percent: row.cpu_usage_percent,
									}
								: undefined,
						memory:
							row.mem_usage_percent !== null
								? {
										total_bytes: Number(row.mem_total_bytes),
										available_bytes: Number(row.mem_available_bytes),
										used_bytes: Number(row.mem_used_bytes),
										usage_percent: row.mem_usage_percent,
									}
								: undefined,
						disk,
						host:
							row.host_os !== null
								? {
										os: row.host_os,
										platform: row.host_platform,
										kernel_version: row.host_kernel_version,
										pretty_name: row.host_pretty_name,
									}
								: undefined,
						errors,
						capture:
							row.capture_version !== null
								? {
										version: row.capture_version,
										mode: row.capture_mode,
									}
								: undefined,
						net,
						performance: row.lighthouse_performance ?? undefined,
						accessibility: row.lighthouse_accessibility ?? undefined,
						bestPractices: row.lighthouse_best_practices ?? undefined,
						seo: row.lighthouse_seo ?? undefined,
						audits:
							row.audit_cls_score !== null
								? {
										cls: { score: row.audit_cls_score, numericValue: row.audit_cls_value, displayValue: row.audit_cls_display },
										si: { score: row.audit_si_score, numericValue: row.audit_si_value, displayValue: row.audit_si_display },
										fcp: { score: row.audit_fcp_score, numericValue: row.audit_fcp_value, displayValue: row.audit_fcp_display },
										lcp: { score: row.audit_lcp_score, numericValue: row.audit_lcp_value, displayValue: row.audit_lcp_display },
										tbt: { score: row.audit_tbt_score, numericValue: row.audit_tbt_value, displayValue: row.audit_tbt_display },
									}
								: undefined,
						createdAt: row.created_at.toISOString(),
					};
				})
			);

			const maintResult = await this.pool.query(
				`SELECT 1 FROM maintenance_windows
				 WHERE monitor_id = $1 AND active = TRUE AND start_time <= NOW() AND end_time >= NOW()
				 LIMIT 1`,
				[monitor.id]
			);
			if ((maintResult.rowCount ?? 0) > 0) {
				monitor.status = "maintenance";
			}

			const statsResult = await this.pool.query(`SELECT uptime_percentage FROM monitor_stats WHERE monitor_id = $1`, [monitor.id]);
			if (statsResult.rows[0]) {
				monitor.uptimePercentage = statsResult.rows[0].uptime_percentage;
			}
		}

		return monitors;
	};

	findMonitorCountByTeamIdAndType = async (teamId: string, config?: TeamQueryConfig): Promise<number> => {
		const { type } = config ?? {};
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];
		let paramIndex = 2;

		if (type !== undefined) {
			if (Array.isArray(type)) {
				conditions.push(`type = ANY($${paramIndex++})`);
				values.push(type);
			} else {
				conditions.push(`type = $${paramIndex++}`);
				values.push(type);
			}
		}

		const result = await this.pool.query(`SELECT COUNT(*)::int AS count FROM monitors WHERE ${conditions.join(" AND ")}`, values);
		return result.rows[0].count;
	};

	updateById = async (monitorId: string, teamId: string, patch: Partial<Monitor>): Promise<Monitor> => {
		const sets: string[] = [];
		const values: unknown[] = [];
		let paramIndex = 1;

		const fieldMap: [keyof Monitor, string][] = [
			["name", "name"],
			["description", "description"],
			["type", "type"],
			["status", "status"],
			["url", "url"],
			["port", "port"],
			["ignoreTlsErrors", "ignore_tls_errors"],
			["useAdvancedMatching", "use_advanced_matching"],
			["jsonPath", "json_path"],
			["expectedValue", "expected_value"],
			["matchMethod", "match_method"],
			["secret", "secret"],
			["interval", "interval_ms"],
			["isActive", "is_active"],
			["statusWindow", "status_window"],
			["statusWindowSize", "status_window_size"],
			["statusWindowThreshold", "status_window_threshold"],
			["uptimePercentage", "uptime_percentage"],
			["cpuAlertThreshold", "cpu_alert_threshold"],
			["cpuAlertCounter", "cpu_alert_counter"],
			["memoryAlertThreshold", "memory_alert_threshold"],
			["memoryAlertCounter", "memory_alert_counter"],
			["diskAlertThreshold", "disk_alert_threshold"],
			["diskAlertCounter", "disk_alert_counter"],
			["tempAlertThreshold", "temp_alert_threshold"],
			["tempAlertCounter", "temp_alert_counter"],
			["selectedDisks", "selected_disks"],
			["gameId", "game_id"],
			["grpcServiceName", "grpc_service_name"],
			["strategy", "strategy"],
			["group", "monitor_group"],
			["geoCheckEnabled", "geo_check_enabled"],
			["geoCheckLocations", "geo_check_locations"],
			["geoCheckInterval", "geo_check_interval_ms"],
		];

		for (const [key, column] of fieldMap) {
			if (patch[key] !== undefined) {
				sets.push(`${column} = $${paramIndex++}`);
				// Empty string matchMethod is stored as NULL (not a valid enum value)
				values.push(key === "matchMethod" && patch[key] === "" ? null : patch[key]);
			}
		}

		if (sets.length === 0) {
			return this.findById(monitorId, teamId);
		}

		sets.push(`updated_at = NOW()`);
		values.push(monitorId, teamId);

		const result = await this.pool.query<MonitorRow>(
			`UPDATE monitors SET ${sets.join(", ")} WHERE id = $${paramIndex++} AND team_id = $${paramIndex}
			 RETURNING ${MONITOR_COLUMNS}`,
			values
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Failed to update monitor with id ${monitorId}`, status: 500 });
		}

		// Update notification associations if provided
		if (patch.notifications !== undefined) {
			await this.pool.query(`DELETE FROM monitor_notifications WHERE monitor_id = $1`, [monitorId]);
			for (const notificationId of patch.notifications) {
				await this.pool.query(`INSERT INTO monitor_notifications (monitor_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [
					monitorId,
					notificationId,
				]);
			}
		}

		const entity = this.toEntity(row);
		entity.notifications = patch.notifications ?? (await this.fetchNotificationIds([monitorId]).then((m) => m.get(monitorId) ?? []));
		return entity;
	};

	togglePauseById = async (monitorId: string, teamId: string): Promise<Monitor> => {
		const result = await this.pool.query<MonitorRow>(
			`UPDATE monitors SET
				is_active = NOT is_active,
				status = CASE WHEN status = 'paused' THEN 'initializing'::monitor_status ELSE 'paused'::monitor_status END,
				updated_at = NOW()
			 WHERE id = $1 AND team_id = $2
			 RETURNING ${MONITOR_COLUMNS}`,
			[monitorId, teamId]
		);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found for the given team.`, status: 404 });
		}
		const entity = this.toEntity(row);
		entity.notifications = await this.fetchNotificationIds([monitorId]).then((m) => m.get(monitorId) ?? []);
		return entity;
	};

	deleteById = async (monitorId: string, teamId: string): Promise<Monitor> => {
		// Fetch notifications before delete (FK cascade will remove join rows)
		const notifs = await this.fetchNotificationIds([monitorId]).then((m) => m.get(monitorId) ?? []);
		const result = await this.pool.query<MonitorRow>(`DELETE FROM monitors WHERE id = $1 AND team_id = $2 RETURNING ${MONITOR_COLUMNS}`, [
			monitorId,
			teamId,
		]);
		const row = result.rows[0];
		if (!row) {
			throw new AppError({ message: `Monitor with ID ${monitorId} not found for the given team.`, status: 404 });
		}
		const entity = this.toEntity(row);
		entity.notifications = notifs;
		return entity;
	};

	deleteByTeamId = async (teamId: string): Promise<{ monitors: Monitor[]; deletedCount: number }> => {
		// Fetch notifications before delete
		const monitorsResult = await this.pool.query<MonitorRow>(`SELECT ${MONITOR_COLUMNS} FROM monitors WHERE team_id = $1`, [teamId]);
		const monitorIds = monitorsResult.rows.map((r) => r.id);
		const notifMap = monitorIds.length > 0 ? await this.fetchNotificationIds(monitorIds) : new Map();

		const result = await this.pool.query<MonitorRow>(`DELETE FROM monitors WHERE team_id = $1 RETURNING ${MONITOR_COLUMNS}`, [teamId]);
		const monitors = result.rows.map((row) => {
			const entity = this.toEntity(row);
			entity.notifications = notifMap.get(row.id) ?? [];
			return entity;
		});
		return { monitors, deletedCount: result.rowCount ?? 0 };
	};

	findMonitorsSummaryByTeamId = async (teamId: string, config?: SummaryConfig): Promise<MonitorsSummary> => {
		const conditions: string[] = ["team_id = $1"];
		const values: unknown[] = [teamId];
		let paramIndex = 2;

		if (config?.type !== undefined) {
			if (Array.isArray(config.type)) {
				conditions.push(`type = ANY($${paramIndex++})`);
				values.push(config.type);
			} else {
				conditions.push(`type = $${paramIndex++}`);
				values.push(config.type);
			}
		}

		const result = await this.pool.query(
			`SELECT
				COUNT(*)::int AS "totalMonitors",
				COUNT(*) FILTER (WHERE status = 'up')::int AS "upMonitors",
				COUNT(*) FILTER (WHERE status = 'down')::int AS "downMonitors",
				COUNT(*) FILTER (WHERE status = 'paused')::int AS "pausedMonitors",
				COUNT(*) FILTER (WHERE status = 'initializing')::int AS "initializingMonitors",
				COUNT(*) FILTER (WHERE status = 'maintenance')::int AS "maintenanceMonitors",
				COUNT(*) FILTER (WHERE status = 'breached')::int AS "breachedMonitors"
			 FROM monitors WHERE ${conditions.join(" AND ")}`,
			values
		);

		return (
			result.rows[0] ?? {
				totalMonitors: 0,
				upMonitors: 0,
				downMonitors: 0,
				pausedMonitors: 0,
				initializingMonitors: 0,
				maintenanceMonitors: 0,
				breachedMonitors: 0,
			}
		);
	};

	findGroupsByTeamId = async (teamId: string): Promise<string[]> => {
		const result = await this.pool.query(
			`SELECT DISTINCT monitor_group FROM monitors
			 WHERE team_id = $1 AND monitor_group IS NOT NULL AND monitor_group != ''
			 ORDER BY monitor_group`,
			[teamId]
		);
		return result.rows.map((row) => row.monitor_group);
	};

	removeNotificationFromMonitors = async (notificationId: string): Promise<void> => {
		await this.pool.query(`DELETE FROM monitor_notifications WHERE notification_id = $1`, [notificationId]);
	};

	updateNotifications = async (
		teamId: string,
		monitorIds: string[],
		notificationIds: string[],
		action: "add" | "remove" | "set"
	): Promise<number> => {
		if (!monitorIds.length) {
			return 0;
		}

		// Verify monitors belong to team
		const monitorCheck = await this.pool.query(`SELECT id FROM monitors WHERE id = ANY($1) AND team_id = $2`, [monitorIds, teamId]);
		const validMonitorIds = monitorCheck.rows.map((row) => row.id);

		if (!validMonitorIds.length) {
			return 0;
		}

		let modified = 0;

		switch (action) {
			case "set": {
				// Track which monitors actually change
				const existingSet = await this.pool.query(`SELECT monitor_id, notification_id FROM monitor_notifications WHERE monitor_id = ANY($1)`, [
					validMonitorIds,
				]);
				const existingByMonitor = new Map<string, Set<string>>();
				for (const row of existingSet.rows) {
					if (!existingByMonitor.has(row.monitor_id)) existingByMonitor.set(row.monitor_id, new Set());
					existingByMonitor.get(row.monitor_id)!.add(row.notification_id);
				}

				await this.pool.query(`DELETE FROM monitor_notifications WHERE monitor_id = ANY($1)`, [validMonitorIds]);
				for (const monitorId of validMonitorIds) {
					const existing = existingByMonitor.get(monitorId);
					const newSet = new Set(notificationIds);
					const changed = !existing || existing.size !== newSet.size || [...newSet].some((id) => !existing.has(id));
					if (changed) modified++;

					for (const notificationId of notificationIds) {
						await this.pool.query(
							`INSERT INTO monitor_notifications (monitor_id, notification_id)
							 VALUES ($1, $2)
							 ON CONFLICT DO NOTHING`,
							[monitorId, notificationId]
						);
					}
				}
				break;
			}
			case "add": {
				// Count monitors where at least one new notification was added
				const monitorsModified = new Set<string>();
				for (const monitorId of validMonitorIds) {
					for (const notificationId of notificationIds) {
						const res = await this.pool.query(
							`INSERT INTO monitor_notifications (monitor_id, notification_id)
							 VALUES ($1, $2)
							 ON CONFLICT DO NOTHING`,
							[monitorId, notificationId]
						);
						if ((res.rowCount ?? 0) > 0) {
							monitorsModified.add(monitorId);
						}
					}
				}
				modified = monitorsModified.size;
				break;
			}
			case "remove": {
				// Count distinct monitors that will be affected before deleting
				const affectedResult = await this.pool.query(
					`SELECT COUNT(DISTINCT monitor_id)::int AS count FROM monitor_notifications
					 WHERE monitor_id = ANY($1) AND notification_id = ANY($2)`,
					[validMonitorIds, notificationIds]
				);
				modified = affectedResult.rows[0]?.count ?? 0;
				await this.pool.query(
					`DELETE FROM monitor_notifications
					 WHERE monitor_id = ANY($1) AND notification_id = ANY($2)`,
					[validMonitorIds, notificationIds]
				);
				break;
			}
			default:
				throw new AppError({ message: `Invalid action: ${action}`, status: 400 });
		}

		return modified;
	};

	deleteByTeamIdsNotIn = async (teamIds: string[]): Promise<number> => {
		if (!teamIds.length) {
			const result = await this.pool.query(`DELETE FROM monitors`);
			return result.rowCount ?? 0;
		}
		const result = await this.pool.query(`DELETE FROM monitors WHERE team_id != ALL($1)`, [teamIds]);
		return result.rowCount ?? 0;
	};

	findAllMonitorIds = async (): Promise<string[]> => {
		const result = await this.pool.query(`SELECT id FROM monitors`);
		return result.rows.map((row) => row.id);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private toCheckSnapshot = (row: any, childData?: { disk: any[]; net: any[]; errors: any[] }) => ({
		id: row.id,
		status: row.status,
		responseTime: row.response_time ?? 0,
		statusCode: row.status_code ?? 0,
		message: row.message ?? "",
		timings:
			row.timing_start !== null
				? {
						start: row.timing_start,
						socket: row.timing_socket,
						lookup: row.timing_lookup,
						connect: row.timing_connect,
						secureConnect: row.timing_secure_connect,
						upload: row.timing_upload,
						response: row.timing_response,
						end: row.timing_end,
						phases: {
							wait: row.phase_wait,
							dns: row.phase_dns,
							tcp: row.phase_tcp,
							tls: row.phase_tls,
							request: row.phase_request,
							firstByte: row.phase_first_byte,
							download: row.phase_download,
							total: row.phase_total,
						},
					}
				: undefined,
		cpu:
			row.cpu_usage_percent !== null
				? {
						physical_core: row.cpu_physical_core,
						logical_core: row.cpu_logical_core,
						frequency: row.cpu_frequency,
						current_frequency: row.cpu_current_frequency,
						temperature: row.cpu_temperature ?? [],
						free_percent: row.cpu_free_percent,
						usage_percent: row.cpu_usage_percent,
					}
				: undefined,
		memory:
			row.mem_usage_percent !== null
				? {
						total_bytes: Number(row.mem_total_bytes),
						available_bytes: Number(row.mem_available_bytes),
						used_bytes: Number(row.mem_used_bytes),
						usage_percent: row.mem_usage_percent,
					}
				: undefined,
		disk: childData?.disk ?? [],
		host:
			row.host_os !== null
				? {
						os: row.host_os,
						platform: row.host_platform,
						kernel_version: row.host_kernel_version,
						pretty_name: row.host_pretty_name,
					}
				: undefined,
		errors: childData?.errors ?? [],
		capture:
			row.capture_version !== null
				? {
						version: row.capture_version,
						mode: row.capture_mode,
					}
				: undefined,
		net: childData?.net ?? [],
		performance: row.lighthouse_performance ?? undefined,
		accessibility: row.lighthouse_accessibility ?? undefined,
		bestPractices: row.lighthouse_best_practices ?? undefined,
		seo: row.lighthouse_seo ?? undefined,
		audits:
			row.audit_cls_score !== null
				? {
						cls: { score: row.audit_cls_score, numericValue: row.audit_cls_value, displayValue: row.audit_cls_display },
						si: { score: row.audit_si_score, numericValue: row.audit_si_value, displayValue: row.audit_si_display },
						fcp: { score: row.audit_fcp_score, numericValue: row.audit_fcp_value, displayValue: row.audit_fcp_display },
						lcp: { score: row.audit_lcp_score, numericValue: row.audit_lcp_value, displayValue: row.audit_lcp_display },
						tbt: { score: row.audit_tbt_score, numericValue: row.audit_tbt_value, displayValue: row.audit_tbt_display },
					}
				: undefined,
		createdAt: row.created_at.toISOString(),
	});

	private fetchNotificationIds = async (monitorIds: string[]): Promise<Map<string, string[]>> => {
		const result = await this.pool.query(`SELECT monitor_id, notification_id FROM monitor_notifications WHERE monitor_id = ANY($1)`, [monitorIds]);
		const map = new Map<string, string[]>();
		for (const row of result.rows) {
			if (!map.has(row.monitor_id)) map.set(row.monitor_id, []);
			map.get(row.monitor_id)!.push(row.notification_id);
		}
		return map;
	};

	private fetchCheckChildData = async (checkId: string) => {
		const [diskResult, netResult, errorsResult] = await Promise.all([
			this.pool.query(
				`SELECT device, mountpoint, total_bytes, free_bytes, used_bytes, usage_percent,
					total_inodes, free_inodes, used_inodes, inodes_usage_percent,
					read_bytes, write_bytes, read_time, write_time
				 FROM check_disks WHERE check_id = $1`,
				[checkId]
			),
			this.pool.query(
				`SELECT name, bytes_sent, bytes_recv, packets_sent, packets_recv,
					err_in, err_out, drop_in, drop_out, fifo_in, fifo_out
				 FROM check_network_interfaces WHERE check_id = $1`,
				[checkId]
			),
			this.pool.query(`SELECT metrics, error FROM check_errors WHERE check_id = $1`, [checkId]),
		]);
		return {
			disk: diskResult.rows.map((d) => ({
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
			})),
			net: netResult.rows.map((n) => ({
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
			})),
			errors: errorsResult.rows.map((e) => ({ metric: e.metrics ?? [], err: e.error ?? "" })),
		};
	};

	private toEntity = (row: MonitorRow): Monitor => ({
		id: row.id,
		userId: row.user_id,
		teamId: row.team_id,
		name: row.name,
		description: row.description ?? undefined,
		status: row.status as MonitorStatus,
		statusWindow: row.status_window ?? [],
		statusWindowSize: row.status_window_size,
		statusWindowThreshold: row.status_window_threshold,
		type: row.type,
		ignoreTlsErrors: row.ignore_tls_errors,
		useAdvancedMatching: row.use_advanced_matching,
		jsonPath: row.json_path ?? undefined,
		expectedValue: row.expected_value ?? undefined,
		matchMethod: row.match_method ?? undefined,
		url: row.url ?? "",
		port: row.port ?? undefined,
		isActive: row.is_active,
		interval: row.interval_ms,
		uptimePercentage: row.uptime_percentage ?? undefined,
		notifications: [],
		secret: row.secret ?? undefined,
		cpuAlertThreshold: row.cpu_alert_threshold,
		cpuAlertCounter: row.cpu_alert_counter,
		memoryAlertThreshold: row.memory_alert_threshold,
		memoryAlertCounter: row.memory_alert_counter,
		diskAlertThreshold: row.disk_alert_threshold,
		diskAlertCounter: row.disk_alert_counter,
		tempAlertThreshold: row.temp_alert_threshold,
		tempAlertCounter: row.temp_alert_counter,
		selectedDisks: row.selected_disks ?? [],
		gameId: row.game_id ?? undefined,
		grpcServiceName: row.grpc_service_name ?? undefined,
		strategy: row.strategy ?? undefined,
		group: row.monitor_group,
		geoCheckEnabled: row.geo_check_enabled,
		geoCheckLocations: row.geo_check_locations ?? [],
		geoCheckInterval: row.geo_check_interval_ms,
		recentChecks: [],
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	});
}
