import { ObjectId } from "mongodb";
import { CheckModel } from "@/db/models/index.js";

const buildUptimeDetailsPipeline = (monitorId, dates, dateString) => {
	return [
		{
			$match: {
				"metadata.monitorId": new ObjectId(monitorId),
				updatedAt: { $gte: dates.start, $lte: dates.end },
			},
		},
		{
			$sort: {
				updatedAt: 1,
			},
		},
		{
			$facet: {
				// For the response time chart, should return checks for date window
				// Grouped by: {day: hour}, {week: day}, {month: day}
				uptimePercentage: [
					{
						$group: {
							_id: null,
							upChecks: {
								$sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] },
							},
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
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
				],
				groupedChecks: [
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
					{
						$sort: {
							_id: 1,
						},
					},
				],
				// Up checks grouped by: {day: hour}, {week: day}, {month: day}
				groupedUpChecks: [
					{
						$match: {
							status: true,
						},
					},
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							totalChecks: {
								$sum: 1,
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
					{
						$sort: { _id: 1 },
					},
				],
				// Down checks grouped by: {day: hour}, {week: day}, {month: day} for the date window
				groupedDownChecks: [
					{
						$match: {
							status: false,
						},
					},
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							totalChecks: {
								$sum: 1,
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
					{
						$sort: { _id: 1 },
					},
				],
			},
		},
		{
			$lookup: {
				from: "monitors",
				let: { monitor_id: { $toObjectId: monitorId } },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$_id", "$$monitor_id"] },
						},
					},
					{
						$project: {
							_id: 1,
							teamId: 1,
							name: 1,
							status: 1,
							interval: 1,
							type: 1,
							url: 1,
							isActive: 1,
							notifications: 1,
						},
					},
				],
				as: "monitor",
			},
		},
		{
			$project: {
				groupedAvgResponseTime: {
					$arrayElemAt: ["$groupedAvgResponseTime.avgResponseTime", 0],
				},

				groupedChecks: "$groupedChecks",
				groupedUpChecks: "$groupedUpChecks",
				groupedDownChecks: "$groupedDownChecks",
				groupedUptimePercentage: { $arrayElemAt: ["$uptimePercentage.percentage", 0] },
				monitor: { $arrayElemAt: ["$monitor", 0] },
			},
		},
	];
};

const buildMonitorStatsPipeline = (monitor) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
			},
		},
		{
			$project: {
				avgResponseTime: 1,
				uptimePercentage: 1,
				totalChecks: 1,
				timeSinceLastCheck: {
					$subtract: [Date.now(), "$lastCheckTimestamp"],
				},
				lastCheckTimestamp: 1,
				uptBurnt: { $toString: "$uptBurnt" },
			},
		},
	];
};

const buildMonitorSummaryByTeamIdPipeline = ({ matchStage }) => {
	return [
		{ $match: matchStage },
		{
			$group: {
				_id: null,
				totalMonitors: { $sum: 1 },
				upMonitors: {
					$sum: {
						$cond: [{ $eq: ["$status", true] }, 1, 0],
					},
				},
				downMonitors: {
					$sum: {
						$cond: [{ $eq: ["$status", false] }, 1, 0],
					},
				},
				pausedMonitors: {
					$sum: {
						$cond: [{ $eq: ["$isActive", false] }, 1, 0],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
			},
		},
	];
};

const buildMonitorsByTeamIdPipeline = ({ matchStage, field, order }) => {
	const sort = { [field]: order === "asc" ? 1 : -1 };

	return [
		{ $match: matchStage },
		{ $sort: sort },
		{
			$project: {
				_id: 1,
				name: 1,
				type: 1,
				port: 1,
			},
		},
	];
};

const buildMonitorsAndSummaryByTeamIdPipeline = ({ matchStage }) => {
	return [
		{ $match: matchStage },
		{
			$facet: {
				summary: [
					{
						$group: {
							_id: null,
							totalMonitors: { $sum: 1 },
							upMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", true] }, 1, 0],
								},
							},
							downMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", false] }, 1, 0],
								},
							},
							pausedMonitors: {
								$sum: {
									$cond: [{ $eq: ["$isActive", false] }, 1, 0],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
						},
					},
				],
				monitors: [
					{ $sort: { name: 1 } },
					{
						$project: {
							_id: 1,
							name: 1,
							type: 1,
						},
					},
				],
			},
		},
		{
			$project: {
				summary: { $arrayElemAt: ["$summary", 0] },
				monitors: 1,
			},
		},
	];
};

const buildMonitorsWithChecksByTeamIdPipeline = ({ matchStage, filter, page, rowsPerPage, field, order, limit, type }) => {
	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	const limitStage = rowsPerPage ? [{ $limit: rowsPerPage }] : [];

	// Match name
	if (typeof filter !== "undefined" && field === "name") {
		matchStage.$or = [{ name: { $regex: filter, $options: "i" } }, { url: { $regex: filter, $options: "i" } }];
	}

	// Match isActive
	if (typeof filter !== "undefined" && field === "isActive") {
		matchStage.isActive = filter === "true" ? true : false;
	}

	if (typeof filter !== "undefined" && field === "status") {
		matchStage.status = filter === "true" ? true : false;
	}

	// Match type
	if (typeof filter !== "undefined" && field === "type") {
		matchStage.type = filter;
	}

	const monitorsPipeline = [
		{ $sort: sort },
		{ $skip: skip },
		...limitStage,
		{
			$project: {
				_id: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				isActive: 1,
				createdAt: 1,
				updatedAt: 1,
				uptimePercentage: 1,
				status: 1,
			},
		},
	];

	// Add checks
	if (limit) {
		const checksCollection = "checks";
		monitorsPipeline.push({
			$lookup: {
				from: checksCollection,
				let: { monitorId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$monitorId", "$$monitorId"] },
						},
					},
					{ $sort: { updatedAt: -1 } },
					{ $limit: limit },
					{
						$project: {
							_id: 1,
							status: 1,
							responseTime: 1,
							statusCode: 1,
							createdAt: 1,
							updatedAt: 1,
							originalResponseTime: 1,
						},
					},
				],
				as: "checks",
			},
		});
	}

	const pipeline = [
		{ $match: matchStage },
		{
			$facet: {
				count: [{ $count: "monitorsCount" }],
				monitors: monitorsPipeline,
			},
		},
		{
			$project: {
				count: { $arrayElemAt: ["$count", 0] },
				monitors: 1,
			},
		},
	];
	return pipeline;
};

const buildFilteredMonitorsByTeamIdPipeline = ({ matchStage, filter, page, rowsPerPage, field, order, limit, type }) => {
	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	const limitStage = rowsPerPage ? [{ $limit: rowsPerPage }] : [];

	if (typeof filter !== "undefined" && field === "name") {
		matchStage.$or = [{ name: { $regex: filter, $options: "i" } }, { url: { $regex: filter, $options: "i" } }];
	}

	if (typeof filter !== "undefined" && field === "status") {
		matchStage.status = filter === "true";
	}

	const pipeline = [{ $match: matchStage }, { $sort: sort }, { $skip: skip }, ...limitStage];

	// Add checks
	if (limit) {
		const checksCollection = "checks";

		pipeline.push({
			$lookup: {
				from: checksCollection,
				let: { monitorId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$monitorId", "$$monitorId"] },
						},
					},
					{ $sort: { createdAt: -1 } },
					{ $limit: limit },
				],
				as: "checks",
			},
		});
	}

	return pipeline;
};

const buildGetMonitorsByTeamIdPipeline = (req) => {
	let { limit, type, page, rowsPerPage, filter, field, order } = req.query;

	limit = parseInt(limit);
	page = parseInt(page);
	rowsPerPage = parseInt(rowsPerPage);
	if (field === undefined) {
		field = "name";
		order = "asc";
	}
	// Build the match stage
	const matchStage = { teamId: new ObjectId(req.params.teamId) };
	if (type !== undefined) {
		matchStage.type = Array.isArray(type) ? { $in: type } : type;
	}

	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	return [
		{ $match: matchStage },
		{
			$facet: {
				summary: [
					{
						$group: {
							_id: null,
							totalMonitors: { $sum: 1 },
							upMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", true] }, 1, 0],
								},
							},
							downMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", false] }, 1, 0],
								},
							},
							pausedMonitors: {
								$sum: {
									$cond: [{ $eq: ["$isActive", false] }, 1, 0],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
						},
					},
				],
				monitors: [
					{ $sort: sort },
					{
						$project: {
							_id: 1,
							name: 1,
						},
					},
				],
				filteredMonitors: [
					...(filter !== undefined
						? [
								{
									$match: {
										$or: [{ name: { $regex: filter, $options: "i" } }, { url: { $regex: filter, $options: "i" } }],
									},
								},
							]
						: []),
					{ $sort: sort },
					{ $skip: skip },
					...(rowsPerPage ? [{ $limit: rowsPerPage }] : []),
					...(limit
						? [
								{
									$lookup: {
										from: "checks",
										let: { monitorId: "$_id" },
										pipeline: [
											{
												$match: {
													$expr: { $eq: ["$monitorId", "$$monitorId"] },
												},
											},
											{ $sort: { createdAt: -1 } },
											...(limit ? [{ $limit: limit }] : []),
										],
										as: "standardchecks",
									},
								},
							]
						: []),

					{
						$addFields: {
							checks: {
								$switch: {
									branches: [
										{
											case: { $in: ["$type", ["http", "ping", "docker", "port", "game"]] },
											then: "$standardchecks",
										},
									],
									default: [],
								},
							},
						},
					},
					{
						$project: {
							standardchecks: 0,
						},
					},
				],
			},
		},
		{
			$project: {
				summary: { $arrayElemAt: ["$summary", 0] },
				filteredMonitors: 1,
				monitors: 1,
			},
		},
	];
};

export {
	buildUptimeDetailsPipeline,
	buildMonitorStatsPipeline,
	buildGetMonitorsByTeamIdPipeline,
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildMonitorsAndSummaryByTeamIdPipeline,
	buildMonitorsWithChecksByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
};

export const getAggregateData = async (monitorId, dates) => {
	const result = await CheckModel.aggregate([
		{
			$match: {
				"metadata.monitorId": new ObjectId(monitorId),
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

export const getUpChecks = async (monitorId, dates) => {
	const count = await CheckModel.countDocuments({
		"metadata.monitorId": new ObjectId(monitorId),
		"metadata.type": "hardware",
		createdAt: { $gte: dates.start, $lte: dates.end },
		status: true,
	});
	return { totalChecks: count };
};

export const getHardwareStats = async (monitorId, dates, dateString) => {
	return await CheckModel.aggregate([
		{
			$match: {
				"metadata.monitorId": new ObjectId(monitorId),
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
