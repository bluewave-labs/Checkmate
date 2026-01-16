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

export type LatestChecksMap = Record<string, Check[]>;
type DateRange = { start: Date; end: Date };
type HardwareAggregateData = { latestCheck: CheckDocument | null; totalChecks: number };
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
				read_speed_bytes: disk?.read_speed_bytes ?? 0,
				write_speed_bytes: disk?.write_speed_bytes ?? 0,
				total_bytes: disk?.total_bytes ?? 0,
				free_bytes: disk?.free_bytes ?? 0,
				usage_percent: disk?.usage_percent ?? 0,
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

	createChecks = async (checks: Check[]) => {
		return await CheckModel.insertMany(checks);
	};

	findLatestChecksByMonitorIds = async (monitorIds: string[], options?: { limitPerMonitor?: number }): Promise<LatestChecksMap> => {
		if (monitorIds.length === 0) {
			return {};
		}
		const mongoIds = monitorIds.map((id) => new mongoose.Types.ObjectId(id));
		const limitPerMonitor = options?.limitPerMonitor ?? 25;
		const checkGroups = await CheckModel.aggregate([
			{
				$match: {
					"metadata.monitorId": { $in: mongoIds },
				},
			},
			{ $sort: { "metadata.monitorId": 1, createdAt: -1 } },
			{
				$group: {
					_id: "$metadata.monitorId",
					latestChecks: {
						$topN: {
							n: limitPerMonitor,
							sortBy: { createdAt: -1 },
							output: "$$ROOT",
						},
					},
				},
			},
		]);

		return checkGroups.reduce<LatestChecksMap>((acc, group) => {
			const monitorId = group._id.toString();
			acc[monitorId] = (group.latestChecks ?? []).map((doc: CheckDocument) => this.toEntity(doc));
			return acc;
		}, {});
	};

	findDateRangeChecksByMonitor = async (monitorId: string, startDate: Date, endDate: Date, dateString: string, options?: { type?: MonitorType }) => {
		const monitorObjectId = new mongoose.Types.ObjectId(monitorId);
		if (options?.type === "hardware") {
			return this.findHardwareDateRangeChecks(monitorObjectId, startDate, endDate, dateString);
		}
		if (options?.type === "pagespeed") {
			return this.findPageSpeedDateRangeChecks(monitorObjectId, startDate, endDate);
		}
		return this.findUptimeDateRangeChecks(options?.type ?? "http", monitorObjectId, startDate, endDate, dateString);
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
			updatedAt: { $gte: startDate, $lte: endDate },
		};
		const [result] = await CheckModel.aggregate([
			{ $match: matchStage },
			{ $sort: { updatedAt: 1 } },
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
			this.getHardwareAggregateData(monitorId, dates),
			this.getHardwareUpChecks(monitorId, dates),
			this.getHardwareStats(monitorId, dates, dateString),
		]);

		const aggregateData = {
			latestCheck: aggregateDataDoc?.latestCheck ? this.toEntity(aggregateDataDoc.latestCheck as CheckDocument) : null,
			totalChecks: aggregateDataDoc?.totalChecks ?? 0,
		};

		const upChecks = {
			totalChecks: upChecksDoc?.totalChecks ?? 0,
		};

		const checks = (hardwareMetrics ?? []).map((metric) => ({
			_id: metric._id,
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
			checks: checks.map((doc) => this.toEntity(doc)),
		};
	};

	deleteByMonitorId = async (monitorId: string): Promise<number> => {
		const result = await CheckModel.deleteMany({ "metadata.monitorId": new mongoose.Types.ObjectId(monitorId) });
		return result.deletedCount;
	};

	private getHardwareAggregateData = async (monitorId: string, dates: DateRange): Promise<HardwareAggregateData> => {
		const result = await CheckModel.aggregate([
			{
				$match: {
					"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
					"metadata.type": "hardware",
					createdAt: { $gte: dates.start, $lte: dates.end },
				},
			},
			{ $sort: { createdAt: -1 } },
			{
				$group: {
					_id: null,
					latestCheck: { $first: "$$ROOT" },
					totalChecks: { $sum: 1 },
				},
			},
		]);
		return result[0] || { totalChecks: 0, latestCheck: null };
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
					updatedAts: { $push: "$updatedAt" },
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
								readSpeed: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.read_speed_bytes", "$$dIdx"] } } } },
								writeSpeed: { $avg: { $map: { input: "$disks", as: "dA", in: { $arrayElemAt: ["$$dA.write_speed_bytes", "$$dIdx"] } } } },
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
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.bytes_sent" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.bytes_sent" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaBytesRecv: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.bytes_recv" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.bytes_recv" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaPacketsSent: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.packets_sent" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.packets_sent" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaPacketsRecv: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.packets_recv" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.packets_recv" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaErrIn: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.err_in" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.err_in" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaErrOut: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.err_out" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.err_out" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaDropIn: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
											f: { $arrayElemAt: [{ $map: { input: { $first: "$net" }, as: "i", in: "$$i.drop_in" } }, "$$nIdx"] },
											l: { $arrayElemAt: [{ $map: { input: { $last: "$net" }, as: "i", in: "$$i.drop_in" } }, "$$nIdx"] },
										},
										in: { $cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0] },
									},
								},
								deltaDropOut: {
									$let: {
										vars: {
											tDiff: { $divide: [{ $subtract: [{ $last: "$updatedAts" }, { $first: "$updatedAts" }] }, 1000] },
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
