import { Types, type PipelineStage } from "mongoose";
import { DISK_COUNTERS, DISK_LEVELS, MS_PER_SECOND, counterPairStages } from "@/domain/checks/check.hardware.pipeline.js";
import { EXCLUDE_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";
import { HARDWARE_COUNTER_MAX_GAP_INTERVALS } from "@/domain/checks/check.type.js";
import { ROLLUP_BUCKET_MINUTES, type HardwareMonitorInterval } from "@/domain/check-rollups/check-rollup.type.js";

const HARDWARE_LEVELS = {
	cpuUsage: "$cpu.usage_percent",
	cpuCurrentFrequency: "$cpu.current_frequency",
	memoryUsedBytes: "$memory.used_bytes",
	memoryAvailableBytes: "$memory.available_bytes",
	memoryUsage: "$memory.usage_percent",
} as const;

const levels = Object.entries(HARDWARE_LEVELS);

const sumOf = (field: string) => ({ $sum: { $cond: [{ $isNumber: field }, field, 0] } });
const countOf = (field: string) => ({ $sum: { $cond: [{ $isNumber: field }, 1, 0] } });

const temperatures = { $ifNull: ["$cpu.temperature", []] };
const readingAt = { $arrayElemAt: ["$$reading", "$$sensor"] };

const bucketStart = { $dateTrunc: { date: "$createdAt", unit: "minute", binSize: ROLLUP_BUCKET_MINUTES } };

export const buildHardwareLevelsRollupStages = (from: Date, to: Date, monitorIds?: Types.ObjectId[]): PipelineStage[] => [
	{
		$match: {
			createdAt: { $gte: from, $lt: to },
			"metadata.type": "hardware",
			...(monitorIds && { "metadata.monitorId": { $in: monitorIds } }),
			...EXCLUDE_DEGRADED_EGRESS_MATCH,
		},
	},
	{
		$group: {
			_id: {
				monitorId: "$metadata.monitorId",
				bucketStart,
			},
			...Object.fromEntries(
				levels.flatMap(([name, field]) => [
					[`${name}Sum`, sumOf(field)],
					[`${name}Count`, countOf(field)],
				])
			),
			readings: { $push: temperatures },
			sensorCount: { $max: { $size: temperatures } },
		},
	},
	{
		$project: {
			_id: 0,
			monitorId: "$_id.monitorId",
			bucketStart: "$_id.bucketStart",
			hardware: {
				...Object.fromEntries(levels.map(([name]) => [name, { sum: `$${name}Sum`, count: `$${name}Count` }])),
				temperature: {
					$map: {
						input: { $range: [0, "$sensorCount"] },
						as: "sensor",
						in: {
							sum: { $sum: { $map: { input: "$readings", as: "reading", in: { $cond: [{ $isNumber: readingAt }, readingAt, 0] } } } },
							count: { $sum: { $map: { input: "$readings", as: "reading", in: { $cond: [{ $isNumber: readingAt }, 1, 0] } } } },
						},
					},
				},
			},
		},
	},
];

const toMaxGapMs = (interval: HardwareMonitorInterval) => HARDWARE_COUNTER_MAX_GAP_INTERVALS * interval.intervalMs;

export const buildHardwareDisksRollupStages = (from: Date, to: Date, intervals: HardwareMonitorInterval[]): PipelineStage[] => {
	const monitorIds = intervals.map((interval) => new Types.ObjectId(interval.monitorId));
	const maxGapSeconds = intervals.map((interval) => toMaxGapMs(interval) / MS_PER_SECOND);
	const lookbackMs = Math.max(0, ...intervals.map(toMaxGapMs));
	const diskLevels = Object.entries(DISK_LEVELS);
	const diskCounters = Object.entries(DISK_COUNTERS);
	return [
		{
			$match: {
				createdAt: { $gte: new Date(from.getTime() - lookbackMs), $lt: to },
				"metadata.type": "hardware",
				"metadata.monitorId": { $in: monitorIds },
				...EXCLUDE_DEGRADED_EGRESS_MATCH,
			},
		},
		{ $set: { maxGapSeconds: { $arrayElemAt: [maxGapSeconds, { $indexOfArray: [monitorIds, "$metadata.monitorId"] }] } } },
		{ $unwind: "$disk" },
		{
			$setWindowFields: {
				partitionBy: { monitorId: "$metadata.monitorId", device: "$disk.device", mountpoint: "$disk.mountpoint" },
				sortBy: { createdAt: 1 },
				output: {
					previous: {
						$shift: {
							by: -1,
							output: {
								at: "$createdAt",
								...Object.fromEntries(diskCounters.map(([name, field]) => [name, `$disk.${field}`])),
							},
						},
					},
				},
			},
		},
		{ $match: { createdAt: { $gte: from } } },
		{ $set: { seconds: { $divide: [{ $subtract: ["$createdAt", "$previous.at"] }, MS_PER_SECOND] } } },
		{
			$set: Object.assign(
				{},
				...diskCounters.map(([name, field]) => counterPairStages(`$disk.${field}`, `$previous.${name}`, name, "$maxGapSeconds"))
			),
		},
		{
			$group: {
				_id: { monitorId: "$metadata.monitorId", bucketStart, device: "$disk.device", mountpoint: "$disk.mountpoint" },
				...Object.fromEntries(
					diskLevels.flatMap(([name, field]) => [
						[`${name}Sum`, sumOf(`$disk.${field}`)],
						[`${name}Count`, countOf(`$disk.${field}`)],
					])
				),
				...Object.fromEntries(
					diskCounters.flatMap(([name]) => [
						[`${name}Change`, { $sum: `$${name}Change` }],
						[`${name}Seconds`, { $sum: `$${name}Seconds` }],
					])
				),
			},
		},
		{ $sort: { "_id.device": 1, "_id.mountpoint": 1 } },
		{
			$group: {
				_id: { monitorId: "$_id.monitorId", bucketStart: "$_id.bucketStart" },
				disks: {
					$push: {
						device: "$_id.device",
						mountpoint: "$_id.mountpoint",
						...Object.fromEntries(diskLevels.map(([name]) => [name, { sum: `$${name}Sum`, count: `$${name}Count` }])),
						...Object.fromEntries(diskCounters.map(([name]) => [name, { change: `$${name}Change`, seconds: `$${name}Seconds` }])),
					},
				},
			},
		},
		{ $project: { _id: 0, monitorId: "$_id.monitorId", bucketStart: "$_id.bucketStart", hardware: { disks: "$disks" } } },
	];
};

export const buildHardwareRollupMergeStage = (collectionName: string): PipelineStage.Merge => ({
	$merge: {
		into: collectionName,
		on: ["monitorId", "bucketStart"],
		whenMatched: [{ $set: { hardware: { $mergeObjects: ["$hardware", "$$new.hardware"] } } }],
		whenNotMatched: "discard",
	},
});
