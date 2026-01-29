import { IChecksRepository } from "@/repositories/index.js";
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
	MonitorType,
} from "@/types/index.js";
import { CheckModel, type CheckDocument } from "@/db/models/index.js";
import mongoose from "mongoose";

const SERVICE_NAME = "StatusService";

const dateRangeLookup: Record<string, Date | undefined> = {
	recent: new Date(new Date().setHours(new Date().getHours() - 2)),
	hour: new Date(new Date().setHours(new Date().getHours() - 1)),
	day: new Date(new Date().setDate(new Date().getDate() - 1)),
	week: new Date(new Date().setDate(new Date().getDate() - 7)),
	month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
	all: undefined,
};

export type LatestChecksMap = Record<string, Check[]>;
type DateRange = { start: Date; end: Date };
type HardwareUpChecks = { totalChecks: number };

class MongoChecksRepository implements IChecksRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	constructor(logger: any) {
		this.logger = logger;
	}

	private toEntity = (doc: CheckDocument): Check => {
		const toStringId = (value: mongoose.Types.ObjectId | string | undefined | null): string => {
			if (!value) {
				return "";
			}
			return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
		};

		const toDateString = (value?: Date | string | null): string => {
			if (!value) {
				return new Date(0).toISOString();
			}
			return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
		};

		const toOptionalDateString = (value?: Date | string | null): string | undefined => {
			if (!value) {
				return undefined;
			}
			return toDateString(value);
		};

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
			ack: doc.ack ?? false,
			ackAt: toOptionalDateString(doc.ackAt),
			expiry: toDateString(doc.expiry),
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
			__v: doc.__v ?? 0,
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

	private toDocument = (check: Partial<Check>): CheckDocument => {
		// Map id to _id for MongoDB storage
		const { id, metadata, ...rest } = check;
		return {
			_id: id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId(),
			metadata: metadata
				? {
						monitorId: new mongoose.Types.ObjectId(metadata.monitorId),
						teamId: new mongoose.Types.ObjectId(metadata.teamId),
						type: metadata.type,
					}
				: {
						monitorId: new mongoose.Types.ObjectId(),
						teamId: new mongoose.Types.ObjectId(),
						type: "http",
					},
			...rest,
		} as unknown as CheckDocument;
	};

	createChecks = async (checks: Check[]) => {
		const docs = checks.map((check) => this.toDocument(check));
		const inserted = await CheckModel.insertMany(docs);
		return this.mapDocuments(inserted as unknown as CheckDocument[]);
	};

	findByMonitorId = async (
		monitorId: string,
		sortOrder: string,
		dateRange: string,
		filter: string,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined
	) => {
		// Match
		const matchStage: Record<string, any> = {
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			...(typeof status !== "undefined" && { status }),
			...(dateRangeLookup[dateRange] && {
				createdAt: {
					$gte: dateRangeLookup[dateRange],
				},
			}),
		};

		if (filter !== undefined) {
			switch (filter) {
				case "all":
					break;
				case "up":
					matchStage.status = true;
					break;
				case "down":
					matchStage.status = false;
					break;
				case "resolve":
					matchStage.status = false;
					matchStage.statusCode = 5000;
					break;
				default:
					this.logger.warn({
						message: "invalid filter",
						service: SERVICE_NAME,
						method: "getChecks",
					});
					break;
			}
		}

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

	findByTeamId = async (sortOrder: string, dateRange: string, filter: string, page: number, rowsPerPage: number, teamId: string) => {
		const matchStage: Record<string, any> = {
			"metadata.teamId": new mongoose.Types.ObjectId(teamId),
			...(dateRangeLookup[dateRange] && {
				createdAt: {
					$gte: dateRangeLookup[dateRange],
				},
			}),
		};
		// Add filter to match stage
		if (filter !== undefined) {
			switch (filter) {
				case "all":
					break;
				case "up":
					matchStage.status = true;
					break;
				case "down":
					matchStage.status = false;
					break;
				case "resolve":
					matchStage.status = false;
					matchStage.statusCode = 5000;
					break;
				default:
					this.logger.warn({
						message: "invalid filter",
						service: SERVICE_NAME,
						method: "getChecksByTeam",
					});
					break;
			}
		}

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

	findLatestByMonitorIds = async (monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap> => {
		if (monitorIds.length === 0) {
			return {};
		}
		const limitPerMonitor = options?.limitPerMonitor ?? 25;
		const dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const results = await Promise.all(
			monitorIds.map(async (monitorId) => {
				const docs = await CheckModel.find({
					"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
					createdAt: { $gte: dateFilter },
				})
					.sort({ createdAt: -1 })
					.limit(limitPerMonitor)
					.lean();
				return { monitorId, docs };
			})
		);

		const mapped = results.reduce<LatestChecksMap>((acc, { monitorId, docs }) => {
			acc[monitorId] = docs.map((doc: any) => this.toEntity(doc as CheckDocument));
			return acc;
		}, {});
		return mapped;
	};

	findByDateRangeAndMonitorId = async (monitorId: string, startDate: Date, endDate: Date, dateString: string, options?: { type?: MonitorType }) => {
		const monitorObjectId = new mongoose.Types.ObjectId(monitorId);
		if (options?.type === "hardware") {
			return this.findHardwareDateRangeChecks(monitorObjectId, startDate, endDate, dateString);
		}
		if (options?.type === "pagespeed") {
			return this.findPageSpeedDateRangeChecks(monitorObjectId, startDate, endDate);
		}
		return this.findUptimeDateRangeChecks(options?.type ?? "http", monitorObjectId, startDate, endDate, dateString);
	};

	findSummaryByTeamId = async (teamId: string, dateRange: string) => {
		const baseMatch = {
			"metadata.teamId": new mongoose.Types.ObjectId(teamId),
			...(dateRangeLookup[dateRange] && {
				createdAt: {
					$gte: dateRangeLookup[dateRange],
				},
			}),
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

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const result = await CheckModel.deleteMany({ "metadata.monitorId": new mongoose.Types.ObjectId(monitorId) });
		return result.deletedCount;
	};

	deleteByTeamId = async (teamId: string) => {
		const deleteResult = await CheckModel.deleteMany({ "metadata.teamId": teamId });
		return deleteResult.deletedCount;
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
								totalChecks: { $sum: 1 },
							},
						},
						{ $sort: { _id: 1 } },
						{ $project: { bucketDate: "$_id", avgResponseTime: 1, totalChecks: 1, _id: 0 } },
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
			this.getHardwareTotalChecks(monitorId, dates),
			this.getHardwareUpChecks(monitorId, dates),
			this.getHardwareStats(monitorId, dates, dateString),
		]);

		const aggregateData = {
			totalChecks: aggregateDataDoc ?? 0,
		};

		const upChecks = {
			totalChecks: upChecksDoc?.totalChecks ?? 0,
		};

		const checks = (hardwareMetrics ?? []).map((metric) => ({
			bucketDate: metric._id,
			avgCpuUsage: metric.avgCpuUsage ?? 0,
			avgMemoryUsage: metric.avgMemoryUsage ?? 0,
			avgTemperature: metric.avgTemperature ?? [],
			disks: (metric.disks ?? []).map((disk: { [key: string]: number | string | undefined }) => ({
				name: disk?.name ?? "",
				readSpeed: disk?.readSpeed ?? 0,
				writeSpeed: disk?.writeSpeed ?? 0,
				totalBytes: disk?.totalBytes ?? 0,
				freeBytes: disk?.freeBytes ?? 0,
				usagePercent: disk?.usagePercent ?? 0,
			})),
			net: (metric.net ?? []).map((iface: { [key: string]: number | string | undefined }) => ({
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
		}));

		return {
			monitorType: "hardware" as const,
			aggregateData,
			upChecks,
			checks,
		};
	};

	private findPageSpeedDateRangeChecks = async (monitorObjectId: mongoose.Types.ObjectId, startDate: Date, endDate: Date) => {
		const matchStage = {
			"metadata.monitorId": monitorObjectId,
			createdAt: { $gte: startDate, $lte: endDate },
		};

		const checks = await CheckModel.find(matchStage).sort({ createdAt: -1 }).limit(25).lean();
		return {
			monitorType: "pagespeed" as const,
			checks: this.mapDocuments(checks),
		};
	};

	private getHardwareTotalChecks = async (monitorId: string, dates: DateRange): Promise<number> => {
		return await CheckModel.countDocuments({
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			"metadata.type": "hardware",
			createdAt: { $gte: dates.start, $lte: dates.end },
		});
	};

	private getHardwareUpChecks = async (monitorId: string, dates: DateRange): Promise<HardwareUpChecks> => {
		const count = await CheckModel.countDocuments({
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			"metadata.type": "hardware",
			createdAt: { $gte: dates.start, $lte: dates.end },
			status: true,
		});
		return { totalChecks: count };
	};

	private getHardwareStats = async (monitorId: string, dates: DateRange, dateString: string) => {
		return await CheckModel.aggregate([
			{
				$match: {
					"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
					"metadata.type": "hardware",
					createdAt: { $gte: dates.start, $lte: dates.end },
				},
			},
			{ $sort: { createdAt: 1 } },
			{
				$group: {
					_id: { $dateToString: { format: dateString, date: "$createdAt" } },
					avgCpuUsage: { $avg: "$cpu.usage_percent" },
					avgMemoryUsage: { $avg: "$memory.usage_percent" },
					avgTemperatures: { $push: { $ifNull: ["$cpu.temperature", [0]] } },
					disks: { $push: "$disk" },
					net: { $push: "$net" },
					createdAts: { $push: "$createdAt" },
					sampleDoc: { $first: "$$ROOT" },
				},
			},
			{
				$project: {
					_id: 1,
					avgCpuUsage: 1,
					avgMemoryUsage: 1,
					avgTemperature: {
						$map: {
							input: { $range: [0, { $size: { $ifNull: [{ $arrayElemAt: ["$avgTemperatures", 0] }, [0]] } }] },
							as: "idx",
							in: { $avg: { $map: { input: "$avgTemperatures", as: "t", in: { $arrayElemAt: ["$$t", "$$idx"] } } } },
						},
					},
					disks: {
						$map: {
							input: { $range: [0, { $size: { $ifNull: ["$sampleDoc.disk", []] } }] },
							as: "dIdx",
							in: {
								name: { $concat: ["disk", { $toString: "$$dIdx" }] },
								readSpeed: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.read_bytes", "$$dIdx"] } } } },
								writeSpeed: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.write_bytes", "$$dIdx"] } } } },
								totalBytes: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.total_bytes", "$$dIdx"] } } } },
								freeBytes: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.free_bytes", "$$dIdx"] } } } },
								usagePercent: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.usage_percent", "$$dIdx"] } } } },
							},
						},
					},
					net: {
						$map: {
							input: { $range: [0, { $size: { $ifNull: ["$sampleDoc.net", []] } }] },
							as: "nIdx",
							in: {
								name: { $arrayElemAt: ["$sampleDoc.net.name", "$$nIdx"] },
								bytesSentPerSecond: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.bytes_sent" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.bytes_sent" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaBytesRecv: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.bytes_recv" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.bytes_recv" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaPacketsSent: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.packets_sent" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.packets_sent" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaPacketsRecv: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.packets_recv" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.packets_recv" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaErrIn: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.err_in" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.err_in" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaErrOut: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.err_out" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.err_out" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaDropIn: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.drop_in" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.drop_in" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaDropOut: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.drop_out" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.drop_out" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
							},
						},
					},
				},
			},
			{ $sort: { _id: 1 } },
		]);
	};
}

export default MongoChecksRepository;
