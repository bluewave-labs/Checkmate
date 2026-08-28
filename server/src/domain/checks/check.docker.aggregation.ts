import CheckModel from "@/domain/checks/check.model.js";
import { DockerStatsBucket } from "@/domain/checks/check.type.js";
import mongoose from "mongoose";

type DateRange = { start: Date; end: Date };

export const getDockerTotalChecks = async (monitorId: string, dates: DateRange): Promise<number> =>
	CheckModel.countDocuments({
		"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
		"metadata.type": "docker",
		createdAt: { $gte: dates.start, $lte: dates.end },
	});

export const getDockerUpChecks = async (monitorId: string, dates: DateRange): Promise<{ totalChecks: number }> => {
	const count = await CheckModel.countDocuments({
		"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
		"metadata.type": "docker",
		createdAt: { $gte: dates.start, $lte: dates.end },
		status: true,
	});
	return { totalChecks: count };
};

export const getDockerStats = async (monitorId: string, dates: DateRange, dateString: string): Promise<DockerStatsBucket[]> =>
	CheckModel.aggregate<DockerStatsBucket>([
		{
			$match: {
				"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
				"metadata.type": "docker",
				createdAt: { $gte: dates.start, $lte: dates.end },
			},
		},
		{
			$group: {
				_id: { $dateToString: { format: dateString, date: "$createdAt" } },
				avgResponseTime: { $avg: "$responseTime" },
				upCount: { $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] } },
				totalCount: { $sum: 1 },
				avgRunning: { $avg: "$containerSummary.running" },
				avgTotal: { $avg: "$containerSummary.total" },
				avgUnhealthy: { $avg: "$containerSummary.unhealthy" },
			},
		},
		{ $sort: { _id: 1 } },
	]);

export const getDockerLatestCheck = async (monitorId: string) =>
	CheckModel.findOne({
		"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
		"metadata.type": "docker",
	})
		.sort({ createdAt: -1 })
		.select("containers containerSummary createdAt")
		.lean();
