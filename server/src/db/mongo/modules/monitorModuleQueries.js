import { ObjectId } from "mongodb";

const buildUptimeDetailsPipeline = (monitorId, dates, dateString) => {
	return [
		{
			$match: {
				monitorId: new ObjectId(monitorId),
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

const buildHardwareDetailsPipeline = (monitor, dates, dateString) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
				type: "hardware",
				createdAt: { $gte: dates.start, $lte: dates.end },
			},
		},
		{
			$sort: {
				createdAt: 1,
			},
		},
		{
			$facet: {
				aggregateData: [
					{
						$group: {
							_id: null,
							latestCheck: {
								$last: "$$ROOT",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				upChecks: [
					{
						$match: {
							status: true,
						},
					},
					{
						$group: {
							_id: null,
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				checks: [
					{
						$limit: 1,
					},
					{
						$project: {
							diskCount: {
								$size: { $ifNull: ["$disk", []] },
							},
							netCount: { $size: { $ifNull: ["$net", []] } },
						},
					},
					{
						$lookup: {
							from: "checks",
							let: {
								diskCount: "$diskCount",
								netCount: "$netCount",
							},
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [{ $eq: ["$monitorId", monitor._id] }, { $gte: ["$createdAt", dates.start] }, { $lte: ["$createdAt", dates.end] }],
										},
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
										avgCpuUsage: {
											$avg: "$cpu.usage_percent",
										},
										avgMemoryUsage: {
											$avg: "$memory.usage_percent",
										},
										avgTemperatures: {
											$push: {
												$ifNull: ["$cpu.temperature", [0]],
											},
										},
										disks: {
											$push: "$disk",
										},
										net: {
											$push: "$net",
										},
										updatedAts: {
											$push: "$updatedAt",
										},
									},
								},
								{
									$project: {
										_id: 1,
										avgCpuUsage: 1,
										avgMemoryUsage: 1,
										avgTemperature: {
											$map: {
												input: {
													$range: [
														0,
														{
															$size: {
																// Handle null temperatures array
																$ifNull: [
																	{ $arrayElemAt: ["$avgTemperatures", 0] },
																	[0], // Default to single-element array if null
																],
															},
														},
													],
												},
												as: "index",
												in: {
													$avg: {
														$map: {
															input: "$avgTemperatures",
															as: "tempArray",
															in: {
																$ifNull: [
																	{ $arrayElemAt: ["$$tempArray", "$$index"] },
																	0, // Default to 0 if element is null
																],
															},
														},
													},
												},
											},
										},
										disks: {
											$map: {
												input: {
													$range: [0, "$$diskCount"],
												},
												as: "diskIndex",
												in: {
													name: {
														$concat: [
															"disk",
															{
																$toString: "$$diskIndex",
															},
														],
													},
													readSpeed: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.read_speed_bytes", "$$diskIndex"],
																},
															},
														},
													},
													writeSpeed: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.write_speed_bytes", "$$diskIndex"],
																},
															},
														},
													},
													totalBytes: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.total_bytes", "$$diskIndex"],
																},
															},
														},
													},
													freeBytes: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.free_bytes", "$$diskIndex"],
																},
															},
														},
													},
													usagePercent: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.usage_percent", "$$diskIndex"],
																},
															},
														},
													},
												},
											},
										},
										net: {
											$map: {
												input: { $range: [0, { $size: { $ifNull: [{ $arrayElemAt: ["$net", 0] }, []] } }] },
												as: "netIndex",
												in: {
													name: {
														$arrayElemAt: [
															{
																$map: {
																	input: { $arrayElemAt: ["$net", 0] },
																	as: "iface",
																	in: "$$iface.name",
																},
															},
															"$$netIndex",
														],
													},
													bytesSentPerSecond: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{ $map: { input: { $arrayElemAt: ["$net", 0] }, as: "iface", in: "$$iface.bytes_sent" } },
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [{ $ifNull: ["$net", []] }, { $subtract: [{ $size: { $ifNull: ["$net", []] } }, 1] }],
																				},
																				as: "iface",
																				in: "$$iface.bytes_sent",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [{ $ifNull: ["$updatedAts", []] }, { $subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1] }],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1] }],
																	},
																	0,
																],
															},
														},
													},
													deltaBytesRecv: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{ $map: { input: { $arrayElemAt: ["$net", 0] }, as: "iface", in: "$$iface.bytes_recv" } },
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [{ $ifNull: ["$net", []] }, { $subtract: [{ $size: { $ifNull: ["$net", []] } }, 1] }],
																				},
																				as: "iface",
																				in: "$$iface.bytes_recv",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [{ $ifNull: ["$updatedAts", []] }, { $subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1] }],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1] }],
																	},
																	0,
																],
															},
														},
													},
													deltaPacketsSent: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{ $map: { input: { $arrayElemAt: ["$net", 0] }, as: "iface", in: "$$iface.packets_sent" } },
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [{ $ifNull: ["$net", []] }, { $subtract: [{ $size: { $ifNull: ["$net", []] } }, 1] }],
																				},
																				as: "iface",
																				in: "$$iface.packets_sent",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [{ $ifNull: ["$updatedAts", []] }, { $subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1] }],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1] }],
																	},
																	0,
																],
															},
														},
													},
													deltaPacketsRecv: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: { $arrayElemAt: ["$net", 0] },
																				as: "iface",
																				in: "$$iface.packets_recv",
																			},
																		},
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [
																						{ $ifNull: ["$net", []] },
																						{
																							$subtract: [{ $size: { $ifNull: ["$net", []] } }, 1],
																						},
																					],
																				},
																				as: "iface",
																				in: "$$iface.packets_recv",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [
																		{ $ifNull: ["$updatedAts", []] },
																		{
																			$subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1],
																		},
																	],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1] }],
																	},
																	0,
																],
															},
														},
													},
													deltaErrIn: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [{ $map: { input: { $arrayElemAt: ["$net", 0] }, as: "iface", in: "$$iface.err_in" } }, "$$netIndex"],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [{ $ifNull: ["$net", []] }, { $subtract: [{ $size: { $ifNull: ["$net", []] } }, 1] }],
																				},
																				as: "iface",
																				in: "$$iface.err_in",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [{ $ifNull: ["$updatedAts", []] }, { $subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1] }],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1] }],
																	},
																	0,
																],
															},
														},
													},
													deltaErrOut: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: { $arrayElemAt: ["$net", 0] },
																				as: "iface",
																				in: "$$iface.err_out",
																			},
																		},
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [
																						{ $ifNull: ["$net", []] },
																						{
																							$subtract: [{ $size: { $ifNull: ["$net", []] } }, 1],
																						},
																					],
																				},
																				as: "iface",
																				in: "$$iface.err_out",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [
																		{ $ifNull: ["$updatedAts", []] },
																		{
																			$subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1],
																		},
																	],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1000] }],
																	},
																	0,
																],
															},
														},
													},
													deltaDropIn: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: { $arrayElemAt: ["$net", 0] },
																				as: "iface",
																				in: "$$iface.drop_in",
																			},
																		},
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [
																						{ $ifNull: ["$net", []] },
																						{
																							$subtract: [{ $size: { $ifNull: ["$net", []] } }, 1],
																						},
																					],
																				},
																				as: "iface",
																				in: "$$iface.drop_in",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [
																		{ $ifNull: ["$updatedAts", []] },
																		{
																			$subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1],
																		},
																	],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1000] }],
																	},
																	0,
																],
															},
														},
													},
													deltaDropOut: {
														$let: {
															vars: {
																first: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: { $arrayElemAt: ["$net", 0] },
																				as: "iface",
																				in: "$$iface.drop_out",
																			},
																		},
																		"$$netIndex",
																	],
																},
																last: {
																	$arrayElemAt: [
																		{
																			$map: {
																				input: {
																					$arrayElemAt: [
																						{ $ifNull: ["$net", []] },
																						{
																							$subtract: [{ $size: { $ifNull: ["$net", []] } }, 1],
																						},
																					],
																				},
																				as: "iface",
																				in: "$$iface.drop_out",
																			},
																		},
																		"$$netIndex",
																	],
																},
																tFirst: { $arrayElemAt: ["$updatedAts", 0] },
																tLast: {
																	$arrayElemAt: [
																		{ $ifNull: ["$updatedAts", []] },
																		{
																			$subtract: [{ $size: { $ifNull: ["$updatedAts", []] } }, 1],
																		},
																	],
																},
															},
															in: {
																$cond: [
																	{ $gt: [{ $subtract: ["$$tLast", "$$tFirst"] }, 0] },
																	{
																		$divide: [{ $subtract: ["$$last", "$$first"] }, { $divide: [{ $subtract: ["$$tLast", "$$tFirst"] }, 1000] }],
																	},
																	0,
																],
															},
														},
													},
												},
											},
										},
										firstUpdatedAt: 1,
										lastUpdatedAt: 1,
									},
								},
							],
							as: "hourlyStats",
						},
					},
					{
						$unwind: "$hourlyStats",
					},
					{
						$replaceRoot: {
							newRoot: "$hourlyStats",
						},
					},
				],
			},
		},
		{ $unwind: "$checks" },
		{ $sort: { "checks._id": 1 } },
		{
			$group: {
				_id: "$_id",
				checks: { $push: "$checks" },
				aggregateData: { $first: "$aggregateData" },
				upChecks: { $first: "$upChecks" },
			},
		},
		{
			$project: {
				aggregateData: {
					$arrayElemAt: ["$aggregateData", 0],
				},
				upChecks: {
					$arrayElemAt: ["$upChecks", 0],
				},
				checks: 1,
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
	buildHardwareDetailsPipeline,
	buildMonitorStatsPipeline,
	buildGetMonitorsByTeamIdPipeline,
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildMonitorsAndSummaryByTeamIdPipeline,
	buildMonitorsWithChecksByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
};
