import type { PipelineStage, Types } from "mongoose";
import { EXCLUDE_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";
import { ROLLUP_BUCKET_MINUTES } from "@/domain/check-rollups/check-rollup.type.js";

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
				bucketStart: { $dateTrunc: { date: "$createdAt", unit: "minute", binSize: ROLLUP_BUCKET_MINUTES } },
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

export const buildHardwareRollupMergeStage = (collectionName: string): PipelineStage.Merge => ({
	$merge: {
		into: collectionName,
		on: ["monitorId", "bucketStart"],
		whenMatched: "merge",
		whenNotMatched: "discard",
	},
});
