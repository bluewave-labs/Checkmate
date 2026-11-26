import type { PipelineStage, Types } from "mongoose";
import { EXCLUDE_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";
import type { CheckDocument } from "@/domain/checks/check.model.js";
import type {
	HardwareMetrics,
	HardwareMetricsBucket,
	HardwareMetricsDisk,
	HardwareMetricsDiskBucket,
	HardwareMetricsInterface,
	HardwareMetricsInterfaceBucket,
	HardwareMetricsLatest,
} from "@/domain/checks/check.type.js";
import { toDateString } from "@/utils/mongoMappers.js";

export type HardwareMetricsWindow = {
	monitorId: Types.ObjectId;
	from: Date;
	to: Date;
	dateFormat: string;
};

type HardwareLevelsRow = {
	_id: string;
	cpuUsage: number | null;
	currentFrequency: number | null;
	usedBytes: number | null;
	availableBytes: number | null;
	memoryUsage: number | null;
};

type HardwareTemperatureRow = {
	_id: { bucket: string; sensor: number };
	value: number | null;
};

export type HardwareLevelsFacet = {
	counts: { total: number; up: number }[];
	levels: HardwareLevelsRow[];
	temperatures: HardwareTemperatureRow[];
};

const INTERFACE_COUNTERS = {
	bytesSent: "bytes_sent",
	bytesRecv: "bytes_recv",
	packetsSent: "packets_sent",
	packetsRecv: "packets_recv",
	errIn: "err_in",
	errOut: "err_out",
	dropIn: "drop_in",
	dropOut: "drop_out",
	fifoIn: "fifo_in",
	fifoOut: "fifo_out",
} as const;

type InterfaceCounter = keyof typeof INTERFACE_COUNTERS;

export type HardwareInterfaceRow = {
	_id: { bucket: string; name: string };
} & Record<`${InterfaceCounter}Change` | `${InterfaceCounter}Seconds`, number>;

export const hardwareChecksFilter = (monitorId: Types.ObjectId) => ({
	"metadata.monitorId": monitorId,
	"metadata.type": "hardware",
	...EXCLUDE_DEGRADED_EGRESS_MATCH,
});

export const buildHardwareLevelsStages = ({ monitorId, from, to, dateFormat }: HardwareMetricsWindow): PipelineStage[] => {
	const bucket = { $dateToString: { format: dateFormat, date: "$createdAt" } };
	return [
		{ $match: { ...hardwareChecksFilter(monitorId), createdAt: { $gte: from, $lte: to } } },
		{
			$facet: {
				counts: [
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							up: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
						},
					},
				],
				levels: [
					{
						$group: {
							_id: bucket,
							cpuUsage: { $avg: "$cpu.usage_percent" },
							currentFrequency: { $avg: "$cpu.current_frequency" },
							usedBytes: { $avg: "$memory.used_bytes" },
							availableBytes: { $avg: "$memory.available_bytes" },
							memoryUsage: { $avg: "$memory.usage_percent" },
						},
					},
					{ $sort: { _id: 1 } },
				],
				temperatures: [
					{ $unwind: { path: "$cpu.temperature", includeArrayIndex: "sensor" } },
					{
						$group: {
							_id: { bucket, sensor: "$sensor" },
							value: { $avg: "$cpu.temperature" },
						},
					},
				],
			},
		},
	];
};

const toTemperaturesByBucket = (rows: HardwareTemperatureRow[]): Map<string, (number | null)[]> => {
	const byBucket = new Map<string, (number | null)[]>();
	for (const row of rows) {
		const sensors = byBucket.get(row._id.bucket) ?? [];
		sensors[row._id.sensor] = row.value;
		byBucket.set(row._id.bucket, sensors);
	}
	for (const [bucket, sensors] of byBucket) {
		byBucket.set(
			bucket,
			Array.from(sensors, (value) => value ?? null)
		);
	}
	return byBucket;
};

export const toHardwareBuckets = (facet: HardwareLevelsFacet | undefined): HardwareMetricsBucket[] => {
	if (!facet) {
		return [];
	}
	const temperatures = toTemperaturesByBucket(facet.temperatures);
	return facet.levels.map((row) => ({
		bucketDate: row._id,
		cpu: {
			usage: row.cpuUsage,
			currentFrequency: row.currentFrequency,
			temperature: temperatures.get(row._id) ?? [],
		},
		memory: {
			usedBytes: row.usedBytes,
			availableBytes: row.availableBytes,
			usage: row.memoryUsage,
		},
	}));
};

export const toHardwareCheckCounts = (facet: HardwareLevelsFacet | undefined): HardwareMetrics["checks"] => ({
	total: facet?.counts[0]?.total ?? 0,
	up: facet?.counts[0]?.up ?? 0,
});

export const toHardwareLatest = (doc: CheckDocument | null): HardwareMetricsLatest | null => {
	if (!doc) {
		return null;
	}
	return {
		checkedAt: toDateString(doc.createdAt),
		host: {
			os: doc.host?.os ?? null,
			platform: doc.host?.platform ?? null,
			kernelVersion: doc.host?.kernel_version ?? null,
			prettyName: doc.host?.pretty_name ?? null,
		},
		capture: {
			version: doc.capture?.version ?? null,
			mode: doc.capture?.mode ?? null,
		},
		cpu: {
			physicalCore: doc.cpu?.physical_core ?? null,
			logicalCore: doc.cpu?.logical_core ?? null,
			frequency: doc.cpu?.frequency ?? null,
			currentFrequency: doc.cpu?.current_frequency ?? null,
			usage: doc.cpu?.usage_percent ?? null,
			temperature: doc.cpu?.temperature ?? null,
		},
		memory: {
			totalBytes: doc.memory?.total_bytes ?? null,
			usedBytes: doc.memory?.used_bytes ?? null,
			availableBytes: doc.memory?.available_bytes ?? null,
			usage: doc.memory?.usage_percent ?? null,
		},
		errors: (doc.errors ?? []).map((error) => ({
			metric: error?.metric ?? [],
			err: error?.err ?? "",
		})),
	};
};

const MS_PER_SECOND = 1000;

const DISK_LEVELS = {
	usedBytes: "used_bytes",
	freeBytes: "free_bytes",
	usage: "usage_percent",
	usedInodes: "used_inodes",
	freeInodes: "free_inodes",
	inodesUsage: "inodes_usage_percent",
} as const;

const DISK_COUNTERS = {
	readBytes: "read_bytes",
	writeBytes: "write_bytes",
	readTime: "read_time",
	writeTime: "write_time",
} as const;

type DiskLevel = keyof typeof DISK_LEVELS;
type DiskCounter = keyof typeof DISK_COUNTERS;

export type HardwareDiskRow = {
	_id: { bucket: string; device: string; mountpoint: string };
} & Record<DiskLevel, number | null> &
	Record<`${DiskCounter}Change` | `${DiskCounter}Seconds`, number>;

const counterPairStages = (current: string, previous: string, name: string, maxGapSeconds: number) => {
	const isPair = {
		$and: [{ $isNumber: current }, { $isNumber: previous }, { $gt: ["$seconds", 0] }, { $lte: ["$seconds", maxGapSeconds] }],
	};
	const change = { $cond: [{ $gte: [current, previous] }, { $subtract: [current, previous] }, current] };
	return {
		[`${name}Change`]: { $cond: [isPair, change, null] },
		[`${name}Seconds`]: { $cond: [isPair, "$seconds", null] },
	};
};

export const buildHardwareDisksStages = ({
	monitorId,
	from,
	to,
	dateFormat,
	maxGapMs,
}: HardwareMetricsWindow & { maxGapMs: number }): PipelineStage[] => {
	const maxGapSeconds = maxGapMs / MS_PER_SECOND;
	const counters = Object.entries(DISK_COUNTERS);
	return [
		{ $match: { ...hardwareChecksFilter(monitorId), createdAt: { $gte: new Date(from.getTime() - maxGapMs), $lte: to } } },
		{ $unwind: "$disk" },
		{
			$setWindowFields: {
				partitionBy: { device: "$disk.device", mountpoint: "$disk.mountpoint" },
				sortBy: { createdAt: 1 },
				output: {
					previous: {
						$shift: {
							by: -1,
							output: {
								at: "$createdAt",
								...Object.fromEntries(counters.map(([name, field]) => [name, `$disk.${field}`])),
							},
						},
					},
				},
			},
		},
		{ $match: { createdAt: { $gte: from } } },
		{ $set: { seconds: { $divide: [{ $subtract: ["$createdAt", "$previous.at"] }, MS_PER_SECOND] } } },
		{
			$set: Object.assign({}, ...counters.map(([name, field]) => counterPairStages(`$disk.${field}`, `$previous.${name}`, name, maxGapSeconds))),
		},
		{
			$group: {
				_id: {
					bucket: { $dateToString: { format: dateFormat, date: "$createdAt" } },
					device: "$disk.device",
					mountpoint: "$disk.mountpoint",
				},
				...Object.fromEntries(Object.entries(DISK_LEVELS).map(([name, field]) => [name, { $avg: `$disk.${field}` }])),
				...Object.fromEntries(
					counters.flatMap(([name]) => [
						[`${name}Change`, { $sum: `$${name}Change` }],
						[`${name}Seconds`, { $sum: `$${name}Seconds` }],
					])
				),
			},
		},
		{ $sort: { "_id.device": 1, "_id.mountpoint": 1, "_id.bucket": 1 } },
	];
};

const perSecond = (change: number, seconds: number): number | null => {
	if (seconds <= 0) {
		return null;
	}
	return change / seconds;
};

const timeFraction = (changeMs: number, seconds: number): number | null => {
	if (seconds <= 0) {
		return null;
	}
	return changeMs / (seconds * MS_PER_SECOND);
};

const diskKey = (device: string, mountpoint: string): string => `${device}\u0000${mountpoint}`;

const toDiskBucket = (row: HardwareDiskRow): HardwareMetricsDiskBucket => ({
	bucketDate: row._id.bucket,
	usedBytes: row.usedBytes,
	freeBytes: row.freeBytes,
	usage: row.usage,
	usedInodes: row.usedInodes,
	freeInodes: row.freeInodes,
	inodesUsage: row.inodesUsage,
	readBytesPerSecond: perSecond(row.readBytesChange, row.readBytesSeconds),
	writeBytesPerSecond: perSecond(row.writeBytesChange, row.writeBytesSeconds),
	readTimeFraction: timeFraction(row.readTimeChange, row.readTimeSeconds),
	writeTimeFraction: timeFraction(row.writeTimeChange, row.writeTimeSeconds),
});

export const toHardwareDisks = (rows: HardwareDiskRow[], latest: CheckDocument | null): HardwareMetricsDisk[] => {
	const disks = new Map<string, HardwareMetricsDisk>();
	for (const entry of latest?.disk ?? []) {
		const device = entry.device ?? "";
		const mountpoint = entry.mountpoint ?? "";
		disks.set(diskKey(device, mountpoint), {
			device,
			mountpoint,
			latest: {
				totalBytes: entry.total_bytes ?? null,
				usedBytes: entry.used_bytes ?? null,
				freeBytes: entry.free_bytes ?? null,
				usage: entry.usage_percent ?? null,
				totalInodes: entry.total_inodes ?? null,
				usedInodes: entry.used_inodes ?? null,
				freeInodes: entry.free_inodes ?? null,
				inodesUsage: entry.inodes_usage_percent ?? null,
			},
			buckets: [],
		});
	}
	for (const row of rows) {
		const key = diskKey(row._id.device, row._id.mountpoint);
		const disk = disks.get(key) ?? { device: row._id.device, mountpoint: row._id.mountpoint, latest: null, buckets: [] };
		disk.buckets.push(toDiskBucket(row));
		disks.set(key, disk);
	}
	return [...disks.values()].sort((a, b) => diskKey(a.device, a.mountpoint).localeCompare(diskKey(b.device, b.mountpoint)));
};

export const buildHardwareInterfacesStages = ({
	monitorId,
	from,
	to,
	dateFormat,
	maxGapMs,
}: HardwareMetricsWindow & { maxGapMs: number }): PipelineStage[] => {
	const maxGapSeconds = maxGapMs / MS_PER_SECOND;
	const counters = Object.entries(INTERFACE_COUNTERS);
	return [
		{ $match: { ...hardwareChecksFilter(monitorId), createdAt: { $gte: new Date(from.getTime() - maxGapMs), $lte: to } } },
		{ $unwind: "$net" },
		{
			$setWindowFields: {
				partitionBy: "$net.name",
				sortBy: { createdAt: 1 },
				output: {
					previous: {
						$shift: {
							by: -1,
							output: {
								at: "$createdAt",
								...Object.fromEntries(counters.map(([name, field]) => [name, `$net.${field}`])),
							},
						},
					},
				},
			},
		},
		{ $match: { createdAt: { $gte: from } } },
		{ $set: { seconds: { $divide: [{ $subtract: ["$createdAt", "$previous.at"] }, MS_PER_SECOND] } } },
		{
			$set: Object.assign({}, ...counters.map(([name, field]) => counterPairStages(`$net.${field}`, `$previous.${name}`, name, maxGapSeconds))),
		},
		{
			$group: {
				_id: {
					bucket: { $dateToString: { format: dateFormat, date: "$createdAt" } },
					name: "$net.name",
				},
				...Object.fromEntries(
					counters.flatMap(([name]) => [
						[`${name}Change`, { $sum: `$${name}Change` }],
						[`${name}Seconds`, { $sum: `$${name}Seconds` }],
					])
				),
			},
		},
		{ $sort: { "_id.name": 1, "_id.bucket": 1 } },
	];
};

const countInBucket = (change: number, seconds: number): number | null => {
	if (seconds <= 0) {
		return null;
	}
	return change;
};

const toInterfaceBucket = (row: HardwareInterfaceRow): HardwareMetricsInterfaceBucket => ({
	bucketDate: row._id.bucket,
	bytesSentPerSecond: perSecond(row.bytesSentChange, row.bytesSentSeconds),
	bytesRecvPerSecond: perSecond(row.bytesRecvChange, row.bytesRecvSeconds),
	packetsSentPerSecond: perSecond(row.packetsSentChange, row.packetsSentSeconds),
	packetsRecvPerSecond: perSecond(row.packetsRecvChange, row.packetsRecvSeconds),
	errIn: countInBucket(row.errInChange, row.errInSeconds),
	errOut: countInBucket(row.errOutChange, row.errOutSeconds),
	dropIn: countInBucket(row.dropInChange, row.dropInSeconds),
	dropOut: countInBucket(row.dropOutChange, row.dropOutSeconds),
	fifoIn: countInBucket(row.fifoInChange, row.fifoInSeconds),
	fifoOut: countInBucket(row.fifoOutChange, row.fifoOutSeconds),
});

export const toHardwareInterfaces = (rows: HardwareInterfaceRow[], latest: CheckDocument | null): HardwareMetricsInterface[] => {
	const interfaces = new Map<string, HardwareMetricsInterface>();
	for (const entry of latest?.net ?? []) {
		const name = entry.name ?? "";
		interfaces.set(name, { name, buckets: [] });
	}
	for (const row of rows) {
		const entry = interfaces.get(row._id.name) ?? { name: row._id.name, buckets: [] };
		entry.buckets.push(toInterfaceBucket(row));
		interfaces.set(row._id.name, entry);
	}
	return [...interfaces.values()].sort((a, b) => a.name.localeCompare(b.name));
};
