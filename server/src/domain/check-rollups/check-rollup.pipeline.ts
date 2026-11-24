import type { PipelineStage, Types } from "mongoose";
import { ONLY_DEGRADED_EGRESS_MATCH } from "@/domain/checks/check.query.js";
import { ROLLUP_BUCKET_MINUTES } from "@/domain/check-rollups/check-rollup.type.js";
import { UptimeDetailsSupportedTypes } from "@/domain/monitors/monitor.type.js";

type UnionWithStage = Exclude<PipelineStage, PipelineStage.Out | PipelineStage.Merge>;

const UPTIME_PHASES = ["dns", "tcp", "tls", "request", "firstByte", "download"] as const;

const isCounted = { $ne: ["$egressStatus", ONLY_DEGRADED_EGRESS_MATCH.egressStatus] };
const isUp = { $and: [isCounted, { $eq: ["$status", true] }] };
const isDown = { $and: [isCounted, { $eq: ["$status", false] }] };
const hasResponseTime = { $isNumber: "$responseTime" };

const countWhen = (condition: object) => ({ $sum: { $cond: [condition, 1, 0] } });
const sumWhen = (condition: object, value: object | string) => ({ $sum: { $cond: [condition, value, 0] } });

export const buildCoreRollupStages = (from: Date, to: Date, monitorId?: Types.ObjectId): UnionWithStage[] => [
	{ $match: { createdAt: { $gte: from, $lt: to }, ...(monitorId && { "metadata.monitorId": monitorId }) } },
	{
		$group: {
			_id: {
				monitorId: "$metadata.monitorId",
				bucketStart: { $dateTrunc: { date: "$createdAt", unit: "minute", binSize: ROLLUP_BUCKET_MINUTES } },
			},
			teamId: { $first: "$metadata.teamId" },
			type: { $first: "$metadata.type" },
			totalChecks: countWhen(isCounted),
			upChecks: countWhen(isUp),
			downChecks: countWhen(isDown),
			degradedChecks: countWhen({ $not: [isCounted] }),
			responseTimeSum: sumWhen({ $and: [isCounted, hasResponseTime] }, "$responseTime"),
			responseTimeCount: countWhen({ $and: [isCounted, hasResponseTime] }),
			upResponseTimeSum: sumWhen({ $and: [isUp, hasResponseTime] }, "$responseTime"),
			upResponseTimeCount: countWhen({ $and: [isUp, hasResponseTime] }),
			downResponseTimeSum: sumWhen({ $and: [isDown, hasResponseTime] }, "$responseTime"),
			downResponseTimeCount: countWhen({ $and: [isDown, hasResponseTime] }),
			...Object.fromEntries(UPTIME_PHASES.map((phase) => [`${phase}Sum`, sumWhen(isCounted, { $ifNull: [`$timings.phases.${phase}`, 0] })])),
		},
	},
	{
		$project: {
			_id: 0,
			monitorId: "$_id.monitorId",
			bucketStart: "$_id.bucketStart",
			teamId: 1,
			type: 1,
			totalChecks: 1,
			upChecks: 1,
			downChecks: 1,
			degradedChecks: 1,
			responseTimeSum: 1,
			responseTimeCount: 1,
			upResponseTimeSum: 1,
			upResponseTimeCount: 1,
			downResponseTimeSum: 1,
			downResponseTimeCount: 1,
			updatedAt: "$$NOW",
			uptime: {
				$cond: [
					{ $in: ["$type", UptimeDetailsSupportedTypes] },
					Object.fromEntries(UPTIME_PHASES.map((phase) => [`${phase}Sum`, `$${phase}Sum`])),
					"$$REMOVE",
				],
			},
		},
	},
];

export const buildRollupMergeStage = (collectionName: string): PipelineStage.Merge => ({
	$merge: {
		into: collectionName,
		on: ["monitorId", "bucketStart"],
		whenMatched: "merge",
		whenNotMatched: "insert",
	},
});

const ROLLUP_SUM_FIELDS = [
	"totalChecks",
	"upChecks",
	"downChecks",
	"responseTimeSum",
	"responseTimeCount",
	"upResponseTimeSum",
	"upResponseTimeCount",
	"downResponseTimeSum",
	"downResponseTimeCount",
] as const;

export const buildUptimeReadStages = ({
	monitorId,
	from,
	rawFrom,
	now,
	dateFormat,
	checksCollectionName,
}: {
	monitorId: Types.ObjectId;
	from: Date;
	rawFrom: Date;
	now: Date;
	dateFormat: string;
	checksCollectionName: string;
}): PipelineStage[] => [
	{ $match: { monitorId, bucketStart: { $gte: from, $lt: rawFrom } } },
	{ $unionWith: { coll: checksCollectionName, pipeline: buildCoreRollupStages(rawFrom, now, monitorId) } },
	{
		$group: {
			_id: { $dateToString: { format: dateFormat, date: "$bucketStart" } },
			...Object.fromEntries(ROLLUP_SUM_FIELDS.map((field) => [field, { $sum: `$${field}` }])),
			...Object.fromEntries(UPTIME_PHASES.map((phase) => [`${phase}Sum`, { $sum: `$uptime.${phase}Sum` }])),
		},
	},
	{ $sort: { _id: 1 } },
];
