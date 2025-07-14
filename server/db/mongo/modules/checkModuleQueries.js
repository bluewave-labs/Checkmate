const buildChecksSummaryByTeamIdPipeline = ({ matchStage }) => {
	return [
		{ $match: matchStage },
		{
			$facet: {
				summary: [
					{
						$group: {
							_id: null,
							totalChecks: { $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] } },
							resolvedChecks: {
								$sum: {
									$cond: [
										{ $and: [{ $eq: ["$ack", true] }, { $eq: ["$status", false] }] },
										1,
										0,
									],
								},
							},
							downChecks: {
								$sum: {
									$cond: [
										{ $and: [{ $eq: ["$ack", false] }, { $eq: ["$status", false] }] },
										1,
										0,
									],
								},
							},
							cannotResolveChecks: {
								$sum: {
									$cond: [{ $eq: ["$statusCode", 5000] }, 1, 0],
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
			},
		},
		{
			$project: {
				summary: { $arrayElemAt: ["$summary", 0] },
			},
		},
	];
};

export { buildChecksSummaryByTeamIdPipeline };
