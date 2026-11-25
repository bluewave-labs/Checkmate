import type { PipelineStage, Types } from "mongoose";
import { EXCLUDE_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";
import type { CheckDocument } from "@/domain/checks/check.model.js";
import type { HardwareMetrics, HardwareMetricsBucket, HardwareMetricsLatest } from "@/domain/checks/check.type.js";
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
