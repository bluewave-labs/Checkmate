import { CheckModel } from "@/domain/checks/check.model.js";
import mongoose from "mongoose";

type DateRange = { start: Date; end: Date };
type HardwareUpChecks = { totalChecks: number };

const NET_RATE_FIELDS = [
	["bytesSentPerSecond", "bytes_sent"],
	["deltaBytesRecv", "bytes_recv"],
	["deltaPacketsSent", "packets_sent"],
	["deltaPacketsRecv", "packets_recv"],
	["deltaErrIn", "err_in"],
	["deltaErrOut", "err_out"],
	["deltaDropIn", "drop_in"],
	["deltaDropOut", "drop_out"],
] as const;

const netRatePerSecond = (sourceField: string) => ({
	$let: {
		vars: {
			tDiff: {
				$divide: [{ $subtract: [{ $last: "$createdAts" }, { $first: "$createdAts" }] }, 1000],
			},
			f: {
				$arrayElemAt: [
					{
						$map: {
							input: { $first: "$net" },
							as: "i",
							in: `$$i.${sourceField}`,
						},
					},
					"$$nIdx",
				],
			},
			l: {
				$arrayElemAt: [
					{
						$map: {
							input: { $last: "$net" },
							as: "i",
							in: `$$i.${sourceField}`,
						},
					},
					"$$nIdx",
				],
			},
		},
		in: {
			$cond: [{ $gt: ["$$tDiff", 0] }, { $divide: [{ $subtract: ["$$l", "$$f"] }, "$$tDiff"] }, 0],
		},
	},
});

export const getHardwareTotalChecks = async (monitorId: string, dates: DateRange): Promise<number> => {
	return await CheckModel.countDocuments({
		"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
		"metadata.type": "hardware",
		createdAt: { $gte: dates.start, $lte: dates.end },
	});
};

export const getHardwareUpChecks = async (monitorId: string, dates: DateRange): Promise<HardwareUpChecks> => {
	const count = await CheckModel.countDocuments({
		"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
		"metadata.type": "hardware",
		createdAt: { $gte: dates.start, $lte: dates.end },
		status: true,
	});
	return { totalChecks: count };
};

export const getHardwareStats = async (monitorId: string, dates: DateRange, dateString: string) => {
	const netProjection = {
		name: { $arrayElemAt: ["$sampleDoc.net.name", "$$nIdx"] },
		...Object.fromEntries(NET_RATE_FIELDS.map(([outputKey, sourceField]) => [outputKey, netRatePerSecond(sourceField)])),
	};

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
						in: netProjection,
					},
				},
			},
		},
		{ $sort: { _id: 1 } },
	]);
};
