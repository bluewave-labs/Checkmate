import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import type {
	Check,
	CheckAudits,
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckMetadata,
	CheckNetworkInterfaceInfo,
	GotTimings,
	HardwareCheckStats,
} from "@/domain/checks/check.type.js";
import type { MonitorType } from "@/domain/monitors/monitor.type.js";
import { CheckModel, type CheckDocument } from "@/domain/checks/check.model.js";
import { DailyCheckBucketModel, type DailyCheckBucketDocument } from "@/domain/checks/daily-check-bucket.model.js";
import mongoose from "mongoose";
import { getDateFormat, getDateForRange } from "@/utils/dataUtils.js";
import { ILogger } from "@/utils/logger.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";

import { getHardwareUpChecks, getHardwareStats, getHardwareTotalChecks } from "@/domain/checks/check.hardware.aggregations.js";
import { CheckFilter, DateRange } from "@/types/query.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR } from "@/types/network.js";

const SERVICE_NAME = "StatusService";
const DAY_MS = 24 * 60 * 60 * 1000;

type RawDailyBucket = {
	monitorId: mongoose.Types.ObjectId;
	teamId?: mongoose.Types.ObjectId;
	date: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	avgResponseTime: number | null;
	responseTimeSum: number;
	responseTimeCount: number;
};

type DailyBucketIncrement = {
	monitorId: mongoose.Types.ObjectId;
	teamId: mongoose.Types.ObjectId;
	timezone: string;
	date: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	responseTimeSum: number;
	responseTimeCount: number;
};

class MongoChecksRepository implements IChecksRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private dateFormatters = new Map<string, Intl.DateTimeFormat>();
	constructor(logger: ILogger) {
		this.logger = logger;
	}

	private toEntity = (doc: CheckDocument): Check => {
		const mapTimings = (timings?: GotTimings): GotTimings => {
			const phases = timings?.phases ?? {
				wait: 0,
				dns: 0,
				tcp: 0,
				tls: 0,
				request: 0,
				firstByte: 0,
				download: 0,
				total: 0,
			};

			return {
				start: timings?.start ?? 0,
				socket: timings?.socket ?? 0,
				lookup: timings?.lookup ?? 0,
				connect: timings?.connect ?? 0,
				secureConnect: timings?.secureConnect ?? 0,
				upload: timings?.upload ?? 0,
				response: timings?.response ?? 0,
				end: timings?.end ?? 0,
				phases,
			};
		};

		const mapCpu = (cpu?: CheckCpuInfo): CheckCpuInfo => ({
			physical_core: cpu?.physical_core ?? 0,
			logical_core: cpu?.logical_core ?? 0,
			frequency: cpu?.frequency ?? 0,
			temperature: cpu?.temperature ?? [],
			free_percent: cpu?.free_percent ?? 0,
			usage_percent: cpu?.usage_percent ?? 0,
		});

		const mapMemory = (memory?: CheckMemoryInfo): CheckMemoryInfo => ({
			total_bytes: memory?.total_bytes ?? 0,
			available_bytes: memory?.available_bytes ?? 0,
			used_bytes: memory?.used_bytes ?? 0,
			usage_percent: memory?.usage_percent ?? 0,
		});

		const mapHost = (host?: CheckHostInfo): CheckHostInfo => ({
			os: host?.os ?? "",
			platform: host?.platform ?? "",
			kernel_version: host?.kernel_version ?? "",
			pretty_name: host?.pretty_name ?? "",
		});

		const mapCapture = (capture?: CheckCaptureInfo): CheckCaptureInfo => ({
			version: capture?.version ?? "",
			mode: capture?.mode ?? "",
		});

		const mapDisks = (disks?: CheckDiskInfo[]): CheckDiskInfo[] =>
			(disks ?? []).map((disk) => ({
				device: disk?.device ?? "",
				mountpoint: disk?.mountpoint ?? "",
				total_bytes: disk?.total_bytes ?? 0,
				free_bytes: disk?.free_bytes ?? 0,
				used_bytes: disk?.used_bytes ?? 0,
				usage_percent: disk?.usage_percent ?? 0,
				total_inodes: disk?.total_inodes ?? 0,
				free_inodes: disk?.free_inodes ?? 0,
				used_inodes: disk?.used_inodes ?? 0,
				inodes_usage_percent: disk?.inodes_usage_percent ?? 0,
				read_bytes: disk?.read_bytes ?? 0,
				write_bytes: disk?.write_bytes ?? 0,
				read_time: disk?.read_time ?? 0,
				write_time: disk?.write_time ?? 0,
			}));

		const mapErrors = (errors?: CheckErrorInfo[]): CheckErrorInfo[] =>
			(errors ?? []).map((error) => ({
				metric: error?.metric ?? [],
				err: error?.err ?? "",
			}));

		const mapNet = (net?: CheckNetworkInterfaceInfo[]): CheckNetworkInterfaceInfo[] =>
			(net ?? []).map((iface) => ({
				name: iface?.name ?? "",
				bytes_sent: iface?.bytes_sent ?? 0,
				bytes_recv: iface?.bytes_recv ?? 0,
				packets_sent: iface?.packets_sent ?? 0,
				packets_recv: iface?.packets_recv ?? 0,
				err_in: iface?.err_in ?? 0,
				err_out: iface?.err_out ?? 0,
				drop_in: iface?.drop_in ?? 0,
				drop_out: iface?.drop_out ?? 0,
				fifo_in: iface?.fifo_in ?? 0,
				fifo_out: iface?.fifo_out ?? 0,
			}));

		const mapAudits = (audits?: CheckAudits): CheckAudits | undefined => {
			if (!audits) {
				return undefined;
			}
			return {
				cls: audits.cls,
				si: audits.si,
				fcp: audits.fcp,
				lcp: audits.lcp,
				tbt: audits.tbt,
			};
		};

		const mapMetadata = (metadata: CheckDocument["metadata"]): CheckMetadata => ({
			monitorId: toStringId(metadata.monitorId),
			teamId: toStringId(metadata.teamId),
			type: metadata.type,
		});

		return {
			id: toStringId(doc._id),
			metadata: mapMetadata(doc.metadata),
			status: doc.status ?? false,
			responseTime: doc.responseTime ?? 0,
			timings: mapTimings(doc.timings),
			statusCode: doc.statusCode ?? 0,
			message: doc.message ?? "",
			cpu: mapCpu(doc.cpu),
			memory: mapMemory(doc.memory),
			disk: mapDisks(doc.disk),
			host: mapHost(doc.host),
			errors: mapErrors(doc.errors),
			capture: mapCapture(doc.capture),
			net: mapNet(doc.net),
			accessibility: doc.accessibility,
			bestPractices: doc.bestPractices,
			seo: doc.seo,
			performance: doc.performance,
			audits: mapAudits(doc.audits),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	private mapDocuments = (documents: CheckDocument[]): Check[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	private formatDateInTimezone = (date: Date, timezone: string): string => {
		let formatter = this.dateFormatters.get(timezone);
		if (!formatter) {
			formatter = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});
			this.dateFormatters.set(timezone, formatter);
		}
		const parts = formatter.formatToParts(date);
		const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
		return `${values.year}-${values.month}-${values.day}`;
	};

	private enumerateDates = (start: Date, end: Date, timezone: string): string[] => {
		const first = Date.parse(`${this.formatDateInTimezone(start, timezone)}T00:00:00.000Z`);
		const last = Date.parse(`${this.formatDateInTimezone(end, timezone)}T00:00:00.000Z`);
		const dates: string[] = [];
		for (let current = first; current <= last; current += DAY_MS) {
			dates.push(new Date(current).toISOString().slice(0, 10));
		}
		return dates;
	};

	private aggregateRawDailyBuckets = async (
		monitorIds: mongoose.Types.ObjectId[],
		start: Date,
		end: Date,
		timezone: string,
		dates: string[]
	): Promise<RawDailyBucket[]> => {
		if (monitorIds.length === 0 || dates.length === 0) {
			return [];
		}
		return CheckModel.aggregate<RawDailyBucket>([
			{
				$match: {
					"metadata.monitorId": { $in: monitorIds },
					createdAt: { $gte: start, $lt: end },
				},
			},
			{
				$group: {
					_id: {
						monitorId: "$metadata.monitorId",
						day: { $dateTrunc: { date: "$createdAt", unit: "day", timezone } },
					},
					teamId: { $first: "$metadata.teamId" },
					totalChecks: { $sum: 1 },
					upChecks: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
					avgResponseTime: { $avg: "$responseTime" },
					responseTimeSum: { $sum: { $cond: [{ $isNumber: "$responseTime" }, "$responseTime", 0] } },
					responseTimeCount: { $sum: { $cond: [{ $isNumber: "$responseTime" }, 1, 0] } },
				},
			},
			{
				$project: {
					_id: 0,
					monitorId: "$_id.monitorId",
					teamId: 1,
					date: { $dateToString: { date: "$_id.day", format: "%Y-%m-%d", timezone } },
					totalChecks: 1,
					upChecks: 1,
					downChecks: { $subtract: ["$totalChecks", "$upChecks"] },
					avgResponseTime: { $round: ["$avgResponseTime", 0] },
					responseTimeSum: 1,
					responseTimeCount: 1,
				},
			},
			{ $match: { date: { $in: dates } } },
		]);
	};

	private ensureDailyBuckets = async (monitorIds: mongoose.Types.ObjectId[], dates: string[], timezone: string): Promise<void> => {
		const existing = await DailyCheckBucketModel.find({ monitorId: { $in: monitorIds }, timezone, date: { $in: dates } })
			.select({ monitorId: 1, date: 1 })
			.lean<Array<Pick<DailyCheckBucketDocument, "monitorId" | "date">>>();
		const existingKeys = new Set(existing.map((bucket) => `${bucket.monitorId.toString()}:${bucket.date}`));
		const missingKeys = new Set<string>();
		const missingMonitorIds = new Map<string, mongoose.Types.ObjectId>();
		const missingDates = new Set<string>();
		for (const monitorId of monitorIds) {
			for (const date of dates) {
				const key = `${monitorId.toString()}:${date}`;
				if (!existingKeys.has(key)) {
					missingKeys.add(key);
					missingMonitorIds.set(monitorId.toString(), monitorId);
					missingDates.add(date);
				}
			}
		}
		if (missingKeys.size === 0) {
			return;
		}

		const orderedMissingDates = [...missingDates].sort();
		const firstDate = orderedMissingDates[0];
		const lastDate = orderedMissingDates[orderedMissingDates.length - 1];
		if (!firstDate || !lastDate) {
			return;
		}
		// Every IANA offset is inside this padding. The final date filter below restores exact local-day membership.
		const start = new Date(Date.parse(`${firstDate}T00:00:00.000Z`) - DAY_MS);
		const end = new Date(Date.parse(`${lastDate}T00:00:00.000Z`) + 2 * DAY_MS);
		const rawBuckets = await this.aggregateRawDailyBuckets([...missingMonitorIds.values()], start, end, timezone, orderedMissingDates);
		const rawByKey = new Map(rawBuckets.map((bucket) => [`${bucket.monitorId.toString()}:${bucket.date}`, bucket]));
		const operations = [...missingKeys].map((key) => {
			const separator = key.indexOf(":");
			const monitorId = new mongoose.Types.ObjectId(key.slice(0, separator));
			const date = key.slice(separator + 1);
			const raw = rawByKey.get(key);
			return {
				updateOne: {
					filter: { monitorId, timezone, date },
					update: {
						$setOnInsert: {
							monitorId,
							...(raw?.teamId && { teamId: raw.teamId }),
							timezone,
							date,
							totalChecks: raw?.totalChecks ?? 0,
							upChecks: raw?.upChecks ?? 0,
							downChecks: raw?.downChecks ?? 0,
							avgResponseTime: raw?.avgResponseTime ?? null,
							responseTimeSum: raw?.responseTimeSum ?? 0,
							responseTimeCount: raw?.responseTimeCount ?? 0,
						},
					},
					upsert: true,
				},
			};
		});
		await DailyCheckBucketModel.bulkWrite(operations, { ordered: false });
	};

	private incrementDailyBuckets = async (checks: CheckDocument[]): Promise<void> => {
		if (checks.length === 0) {
			return;
		}
		const monitorIds = [...new Map(checks.map((check) => [check.metadata.monitorId.toString(), check.metadata.monitorId])).values()];
		const materializedPairs = await DailyCheckBucketModel.aggregate<{
			_id: { monitorId: mongoose.Types.ObjectId; timezone: string };
		}>([{ $match: { monitorId: { $in: monitorIds } } }, { $group: { _id: { monitorId: "$monitorId", timezone: "$timezone" } } }]);
		if (materializedPairs.length === 0) {
			return;
		}
		const timezonesByMonitor = materializedPairs.reduce((map, pair) => {
			const monitorId = pair._id.monitorId.toString();
			const timezones = map.get(monitorId) ?? [];
			timezones.push(pair._id.timezone);
			map.set(monitorId, timezones);
			return map;
		}, new Map<string, string[]>());

		const increments = new Map<string, DailyBucketIncrement>();
		for (const check of checks) {
			const monitorId = check.metadata.monitorId.toString();
			for (const timezone of timezonesByMonitor.get(monitorId) ?? []) {
				const date = this.formatDateInTimezone(new Date(check.createdAt), timezone);
				const key = `${monitorId}:${timezone}:${date}`;
				const increment = increments.get(key) ?? {
					monitorId: check.metadata.monitorId,
					teamId: check.metadata.teamId,
					timezone,
					date,
					totalChecks: 0,
					upChecks: 0,
					downChecks: 0,
					responseTimeSum: 0,
					responseTimeCount: 0,
				};
				increment.totalChecks += 1;
				if (check.status === true) {
					increment.upChecks += 1;
				} else {
					increment.downChecks += 1;
				}
				if (typeof check.responseTime === "number") {
					increment.responseTimeSum += check.responseTime;
					increment.responseTimeCount += 1;
				}
				increments.set(key, increment);
			}
		}

		const now = new Date();
		const operations = [...increments.values()].map((increment) => ({
			updateOne: {
				filter: { monitorId: increment.monitorId, timezone: increment.timezone, date: increment.date },
				update: [
					{
						$set: {
							monitorId: increment.monitorId,
							teamId: increment.teamId,
							timezone: increment.timezone,
							date: increment.date,
							totalChecks: { $add: [{ $ifNull: ["$totalChecks", 0] }, increment.totalChecks] },
							upChecks: { $add: [{ $ifNull: ["$upChecks", 0] }, increment.upChecks] },
							downChecks: { $add: [{ $ifNull: ["$downChecks", 0] }, increment.downChecks] },
							responseTimeSum: { $add: [{ $ifNull: ["$responseTimeSum", 0] }, increment.responseTimeSum] },
							responseTimeCount: { $add: [{ $ifNull: ["$responseTimeCount", 0] }, increment.responseTimeCount] },
							createdAt: { $ifNull: ["$createdAt", now] },
							updatedAt: now,
						},
					},
					{
						$set: {
							avgResponseTime: {
								$cond: [{ $eq: ["$responseTimeCount", 0] }, null, { $round: [{ $divide: ["$responseTimeSum", "$responseTimeCount"] }, 0] }],
							},
						},
					},
				],
				upsert: true,
			},
		}));
		if (operations.length > 0) {
			await DailyCheckBucketModel.bulkWrite(operations, { ordered: false });
		}
	};

	private updateDailyBucketsAfterInsert = async (checks: CheckDocument[]): Promise<void> => {
		try {
			await this.incrementDailyBuckets(checks);
		} catch (error) {
			const monitorIds = [...new Map(checks.map((check) => [check.metadata.monitorId.toString(), check.metadata.monitorId])).values()];
			this.logger.error({
				message: "Failed to update daily check buckets; invalidating them for lazy rebuild",
				service: SERVICE_NAME,
				method: "updateDailyBucketsAfterInsert",
				details: { error: error instanceof Error ? error.message : String(error) },
			});
			await DailyCheckBucketModel.deleteMany({ monitorId: { $in: monitorIds } });
		}
	};

	private toDocument = (check: Partial<Check>): CheckDocument => {
		// Map id to _id for MongoDB storage
		const { id, metadata, ...rest } = check;
		if (!metadata || !metadata.monitorId || !metadata.teamId) {
			throw new AppError({
				message: `Check must have valid metadata with monitorId and teamId. Got: ${JSON.stringify({ id, metadata })}`,
				status: 500,
				service: SERVICE_NAME,
				method: "toDocument",
			});
		}
		return {
			_id: id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId(),
			metadata: {
				monitorId: new mongoose.Types.ObjectId(metadata.monitorId),
				teamId: new mongoose.Types.ObjectId(metadata.teamId),
				type: metadata.type,
			},
			...rest,
		} as unknown as CheckDocument;
	};

	create = async (check: Check) => {
		const savedCheck = await CheckModel.create(check);
		await this.updateDailyBucketsAfterInsert([savedCheck]);
		return this.toEntity(savedCheck);
	};

	createChecks = async (checks: Check[]) => {
		const docs = checks.map((check) => this.toDocument(check));
		const inserted = await CheckModel.insertMany(docs);
		await this.updateDailyBucketsAfterInsert(inserted as unknown as CheckDocument[]);
		return this.mapDocuments(inserted as unknown as CheckDocument[]);
	};

	private filterToMatch = (filter: CheckFilter | undefined): Record<string, unknown> => {
		switch (filter) {
			case "up":
				return { status: true };
			case "down":
				return { status: false };
			case "resolve":
				return { status: false, statusCode: NETWORK_ERROR };
			default:
				this.logger.warn({
					message: "invalid filter",
					service: SERVICE_NAME,
					method: "filterToMatch",
				});
				return {};
		}
	};

	findByMonitorId = async (
		monitorId: string,
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined,
		filter?: CheckFilter
	) => {
		// Match
		const matchStage: Record<string, unknown> = {
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			...(typeof status !== "undefined" && { status }),
			createdAt: { $gte: getDateForRange(dateRange) },
			...this.filterToMatch(filter),
		};

		//Sort
		const convertedSortOrder = sortOrder === "asc" ? 1 : -1;

		// Pagination
		let skip = 0;
		if (page && rowsPerPage) {
			skip = page * rowsPerPage;
		}

		const [checksCount, checks] = await Promise.all([
			CheckModel.countDocuments(matchStage),
			CheckModel.find(matchStage).sort({ createdAt: convertedSortOrder }).skip(skip).limit(rowsPerPage).lean() as Promise<CheckDocument[]>,
		]);

		return { checksCount, checks: this.mapDocuments(checks) };
	};

	findByTeamId = async (sortOrder: string, dateRange: DateRange, page: number, rowsPerPage: number, teamId: string, filter?: CheckFilter) => {
		const matchStage: Record<string, unknown> = {
			"metadata.teamId": new mongoose.Types.ObjectId(teamId),
			createdAt: { $gte: getDateForRange(dateRange) },
			...this.filterToMatch(filter),
		};

		const parsedSortOrder = sortOrder === "asc" ? 1 : -1;

		// pagination
		let skip = 0;
		if (page && rowsPerPage) {
			skip = page * rowsPerPage;
		}

		const [checksCount, checks] = await Promise.all([
			CheckModel.countDocuments(matchStage),
			CheckModel.find(matchStage).sort({ createdAt: parsedSortOrder }).skip(skip).limit(rowsPerPage).lean() as Promise<CheckDocument[]>,
		]);

		return { checksCount, checks: this.mapDocuments(checks) };
	};

	findByDateRangeAndMonitorId = async (monitorId: string, dateRange: DateRange, options?: { type?: MonitorType }) => {
		const monitorObjectId = new mongoose.Types.ObjectId(monitorId);
		const start = getDateForRange(dateRange);
		const dateString = getDateFormat(dateRange);

		const end = new Date();
		if (options?.type === "hardware") {
			return this.findHardwareDateRangeChecks(monitorObjectId, start, end, dateString);
		}
		if (options?.type === "pagespeed") {
			return this.findPageSpeedDateRangeChecks(monitorObjectId, start, end, dateString);
		}
		return this.findUptimeDateRangeChecks(options?.type ?? "http", monitorObjectId, start, end, dateString);
	};

	findSummaryByTeamId = async (teamId: string, dateRange: DateRange) => {
		const baseMatch = {
			"metadata.teamId": new mongoose.Types.ObjectId(teamId),
			createdAt: { $gte: getDateForRange(dateRange) },
		};

		const [totalResult, downResult] = await Promise.all([
			CheckModel.countDocuments(baseMatch),
			CheckModel.countDocuments({ ...baseMatch, status: false }),
		]);

		return {
			totalChecks: totalResult,
			downChecks: downResult,
		};
	};

	findUnevaluatedByMonitorId = async (monitorId: string, since: number) => {
		const docs = await CheckModel.find({
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			createdAt: { $gt: new Date(since) },
		})
			.sort({ createdAt: 1 })
			.lean<CheckDocument[]>();
		return docs.map(this.toEntity);
	};

	getDailyStatusBuckets = async (monitorIds: string[], days: number, timezone: string) => {
		if (monitorIds.length === 0) {
			return [];
		}
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		// Preserve the legacy extra partial date; the client enumerates exactly `days` complete dates and ignores this oldest edge.
		const now = new Date();
		const windowStart = new Date(now.getTime() - days * DAY_MS);
		const dates = this.enumerateDates(windowStart, now, timezone);
		await this.ensureDailyBuckets(objectIds, dates, timezone);

		const cached = await DailyCheckBucketModel.find({
			monitorId: { $in: objectIds },
			timezone,
			date: { $in: dates },
			totalChecks: { $gt: 0 },
		})
			.sort({ date: 1 })
			.lean<DailyCheckBucketDocument[]>();

		// The historical query starts at an exact rolling timestamp, so its oldest local day is partial.
		// Re-read only that edge from raw checks; all complete days come from one materialized document each.
		const oldestDate = dates[0];
		const oldestEnd = oldestDate ? new Date(Date.parse(`${oldestDate}T00:00:00.000Z`) + 2 * DAY_MS) : now;
		const partialOldest = oldestDate ? await this.aggregateRawDailyBuckets(objectIds, windowStart, oldestEnd, timezone, [oldestDate]) : [];
		return [
			...partialOldest.map((bucket) => ({
				monitorId: bucket.monitorId.toString(),
				date: bucket.date,
				totalChecks: bucket.totalChecks,
				upChecks: bucket.upChecks,
				downChecks: bucket.downChecks,
				avgResponseTime: bucket.avgResponseTime,
			})),
			...cached
				.filter((bucket) => bucket.date !== oldestDate)
				.map((bucket) => ({
					monitorId: bucket.monitorId.toString(),
					date: bucket.date,
					totalChecks: bucket.totalChecks,
					upChecks: bucket.upChecks,
					downChecks: bucket.downChecks,
					avgResponseTime: bucket.avgResponseTime,
				})),
		].sort((a, b) => a.date.localeCompare(b.date));
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const objectId = new mongoose.Types.ObjectId(monitorId);
		const result = await CheckModel.deleteMany({ "metadata.monitorId": objectId });
		await DailyCheckBucketModel.deleteMany({ monitorId: objectId });
		return result.deletedCount;
	};

	deleteByTeamId = async (teamId: string) => {
		const objectId = new mongoose.Types.ObjectId(teamId);
		const deleteResult = await CheckModel.deleteMany({ "metadata.teamId": objectId });
		await DailyCheckBucketModel.deleteMany({ teamId: objectId });
		return deleteResult.deletedCount;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		const objectIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const result = await CheckModel.deleteMany({ "metadata.monitorId": { $nin: objectIds } });
		await DailyCheckBucketModel.deleteMany({ monitorId: { $nin: objectIds } });
		return result.deletedCount ?? 0;
	};

	deleteOlderThan = async (cutoffDate: Date, batchDays: number = 30): Promise<number> => {
		// Find the oldest check that is older than the cutoff
		const oldest = await CheckModel.findOne({ createdAt: { $lt: cutoffDate } })
			.sort({ createdAt: 1 })
			.select({ createdAt: 1 });
		if (!oldest?.createdAt) return 0;

		let totalDeleted = 0;
		let batchStart = new Date(oldest.createdAt);
		const batchMs = batchDays * 24 * 60 * 60 * 1000;

		// Delete in 30 day chunks until we reach the cutoff
		while (batchStart < cutoffDate) {
			// Advance startTime by batchMs to get to the end of last batch
			const nextStart = batchStart.getTime() + batchMs;
			const batchEnd = new Date(Math.min(nextStart, cutoffDate.getTime()));
			const result = await CheckModel.deleteMany({
				createdAt: { $gte: batchStart, $lt: batchEnd },
			});
			totalDeleted += result.deletedCount ?? 0;
			batchStart = batchEnd;
		}

		const timezones = await DailyCheckBucketModel.distinct("timezone");
		if (timezones.length > 0) {
			await DailyCheckBucketModel.deleteMany({
				$or: timezones.map((timezone) => ({ timezone, date: { $lte: this.formatDateInTimezone(cutoffDate, timezone) } })),
			});
		}

		return totalDeleted;
	};
	private findUptimeDateRangeChecks = async (
		monitorType: Exclude<MonitorType, "hardware" | "pagespeed">,
		monitorObjectId: mongoose.Types.ObjectId,
		startDate: Date,
		endDate: Date,
		dateString: string
	) => {
		const matchStage = {
			"metadata.monitorId": monitorObjectId,
			createdAt: { $gte: startDate, $lte: endDate },
		};
		const [result] = await CheckModel.aggregate([
			{ $match: matchStage },
			{ $sort: { createdAt: 1 } },
			{
				$facet: {
					uptimePercentage: [
						{
							$group: {
								_id: null,
								upChecks: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
								totalChecks: { $sum: 1 },
							},
						},
						{
							$project: {
								_id: 0,
								percentage: {
									$cond: [{ $eq: ["$totalChecks", 0] }, 0, { $divide: ["$upChecks", "$totalChecks"] }],
								},
							},
						},
					],
					groupedAvgResponseTime: [
						{
							$group: {
								_id: null,
								avgResponseTime: { $avg: "$responseTime" },
							},
						},
					],
					groupedChecks: [
						{
							$group: {
								_id: {
									$dateToString: { format: dateString, date: "$createdAt" },
								},
								avgResponseTime: { $avg: "$responseTime" },
								avgDns: { $avg: { $ifNull: ["$timings.phases.dns", 0] } },
								avgTcp: { $avg: { $ifNull: ["$timings.phases.tcp", 0] } },
								avgTls: { $avg: { $ifNull: ["$timings.phases.tls", 0] } },
								avgRequest: { $avg: { $ifNull: ["$timings.phases.request", 0] } },
								avgFirstByte: { $avg: { $ifNull: ["$timings.phases.firstByte", 0] } },
								avgDownload: { $avg: { $ifNull: ["$timings.phases.download", 0] } },
								totalChecks: { $sum: 1 },
							},
						},
						{ $sort: { _id: 1 } },
						{
							$project: {
								bucketDate: "$_id",
								avgResponseTime: 1,
								totalChecks: 1,
								avgDns: 1,
								avgTcp: 1,
								avgTls: 1,
								avgRequest: 1,
								avgFirstByte: 1,
								avgDownload: 1,
								_id: 0,
							},
						},
					],
					groupedUpChecks: [
						{ $match: { status: true } },
						{
							$group: {
								_id: {
									$dateToString: { format: dateString, date: "$createdAt" },
								},
								totalChecks: { $sum: 1 },
								avgResponseTime: { $avg: "$responseTime" },
							},
						},
						{ $sort: { _id: 1 } },
						{ $project: { bucketDate: "$_id", avgResponseTime: 1, totalChecks: 1, _id: 0 } },
					],
					groupedDownChecks: [
						{ $match: { status: false } },
						{
							$group: {
								_id: {
									$dateToString: { format: dateString, date: "$createdAt" },
								},
								totalChecks: { $sum: 1 },
								avgResponseTime: { $avg: "$responseTime" },
							},
						},
						{ $sort: { _id: 1 } },
						{ $project: { bucketDate: "$_id", avgResponseTime: 1, totalChecks: 1, _id: 0 } },
					],
				},
			},
		]);

		const uptimePercentage = result?.uptimePercentage?.[0]?.percentage ?? 0;
		const avgResponseTime = result?.groupedAvgResponseTime?.[0]?.avgResponseTime ?? 0;

		return {
			monitorType,
			groupedChecks: result?.groupedChecks ?? [],
			groupedUpChecks: result?.groupedUpChecks ?? [],
			groupedDownChecks: result?.groupedDownChecks ?? [],
			uptimePercentage,
			avgResponseTime,
		};
	};

	private findHardwareDateRangeChecks = async (monitorObjectId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, dateString: string) => {
		const monitorId = monitorObjectId.toHexString();
		const dates = { start: startDate, end: endDate };
		const [aggregateDataDoc, upChecksDoc, hardwareMetrics] = await Promise.all([
			getHardwareTotalChecks(monitorId, dates),
			getHardwareUpChecks(monitorId, dates),
			getHardwareStats(monitorId, dates, dateString),
		]);

		const aggregateData = {
			totalChecks: aggregateDataDoc ?? 0,
		};

		const upChecks = {
			totalChecks: upChecksDoc?.totalChecks ?? 0,
		};

		const checks = (hardwareMetrics ?? []).map(
			(metric): HardwareCheckStats => ({
				bucketDate: metric._id,
				avgCpuUsage: metric.avgCpuUsage ?? 0,
				avgMemoryUsage: metric.avgMemoryUsage ?? 0,
				avgTemperature: metric.avgTemperature ?? [],
				disks: (metric.disks ?? []).map((disk) => ({
					name: disk?.name ?? "",
					readSpeed: disk?.readSpeed ?? 0,
					writeSpeed: disk?.writeSpeed ?? 0,
					totalBytes: disk?.totalBytes ?? 0,
					freeBytes: disk?.freeBytes ?? 0,
					usagePercent: disk?.usagePercent ?? 0,
				})),
				net: (metric.net ?? []).map((iface) => ({
					name: iface?.name ?? "",
					bytesSentPerSecond: iface?.bytesSentPerSecond ?? 0,
					deltaBytesRecv: iface?.deltaBytesRecv ?? 0,
					deltaPacketsSent: iface?.deltaPacketsSent ?? 0,
					deltaPacketsRecv: iface?.deltaPacketsRecv ?? 0,
					deltaErrIn: iface?.deltaErrIn ?? 0,
					deltaErrOut: iface?.deltaErrOut ?? 0,
					deltaDropIn: iface?.deltaDropIn ?? 0,
					deltaDropOut: iface?.deltaDropOut ?? 0,
					deltaFifoIn: iface?.deltaFifoIn ?? 0,
					deltaFifoOut: iface?.deltaFifoOut ?? 0,
				})),
			})
		);

		return {
			monitorType: "hardware" as const,
			aggregateData,
			upChecks,
			checks,
		};
	};

	private findPageSpeedDateRangeChecks = async (monitorObjectId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, dateString: string) => {
		const matchStage = {
			"metadata.monitorId": monitorObjectId,
			createdAt: { $gte: startDate, $lte: endDate },
		};

		const [result] = await CheckModel.aggregate([
			{ $match: matchStage },
			{ $sort: { createdAt: 1 } },
			{
				$facet: {
					groupedChecks: [
						{
							$group: {
								_id: {
									$dateToString: { format: dateString, date: "$createdAt" },
								},
								avgPerformance: { $avg: "$performance" },
								avgAccessibility: { $avg: "$accessibility" },
								avgBestPractices: { $avg: "$bestPractices" },
								avgSeo: { $avg: "$seo" },
								totalChecks: { $sum: 1 },
							},
						},
						{ $sort: { _id: 1 } },
						{
							$project: {
								bucketDate: "$_id",
								performance: "$avgPerformance",
								accessibility: "$avgAccessibility",
								bestPractices: "$avgBestPractices",
								seo: "$avgSeo",
								totalChecks: 1,
								_id: 0,
							},
						},
					],
				},
			},
		]);

		return {
			monitorType: "pagespeed" as const,
			groupedChecks: result?.groupedChecks ?? [],
		};
	};
}

export default MongoChecksRepository;
