import DistributedUptimeCheck from "../../models/DistributedUptimeCheck.js";
import { ObjectId } from "mongodb";

const SERVICE_NAME = "distributedCheckModule";

const createDistributedCheck = async (checkData) => {
	try {
		if (typeof checkData.monitorId === "string") {
			checkData.monitorId = ObjectId.createFromHexString(checkData.monitorId);
		}
		const check = await DistributedUptimeCheck.findOneAndUpdate(
			{
				monitorId: checkData.monitorId,
				city: checkData.city,
			},
			[
				{
					$set: {
						...checkData,

						responseTime: {
							$cond: {
								if: { $ifNull: ["$count", false] },
								then: {
									$cond: {
										// Check if the new value is an outlier (3x the current average)
										if: {
											$and: [
												{ $gt: ["$responseTime", 0] },
												{
													$gt: [
														checkData.responseTime,
														{ $multiply: ["$responseTime", 3] },
													],
												},
											],
										},
										then: "$responseTime", // Keep the current value if it's an outlier
										else: {
											// Normal case - calculate new average
											$round: [
												{
													$divide: [
														{
															$add: [
																{ $multiply: ["$responseTime", "$count"] },
																checkData.responseTime,
															],
														},
														{ $add: ["$count", 1] },
													],
												},
												2,
											],
										},
									},
								},
								else: checkData.responseTime,
							},
						},
						count: { $add: [{ $ifNull: ["$count", 0] }, 1] },
					},
				},
			],
			{
				upsert: true,
				new: true,
				runValidators: true,
			}
		);
		return check;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createCheck";
		throw error;
	}
};

const createDistributedChecks = async (checksData) => {
	try {
		if (!Array.isArray(checksData) || checksData.length === 0) {
			return;
		}

		const bulkOps = checksData.map((checkData) => {
			if (typeof checkData.monitorId === "string") {
				checkData.monitorId = ObjectId.createFromHexString(checkData.monitorId);
			}

			return {
				updateOne: {
					filter: {
						monitorId: checkData.monitorId,
						city: checkData.city,
					},
					update: [
						{
							$set: {
								...checkData,
								responseTime: {
									$cond: {
										if: { $ifNull: ["$count", false] },
										then: {
											$round: [
												{
													$divide: [
														{
															$add: [
																{ $multiply: ["$responseTime", "$count"] },
																checkData.responseTime,
															],
														},
														{ $add: ["$count", 1] },
													],
												},
												2,
											],
										},
										else: checkData.responseTime,
									},
								},
								count: { $add: [{ $ifNull: ["$count", 0] }, 1] },
							},
						},
					],
					upsert: true,
				},
			};
		});

		// Execute bulk operation
		await DistributedUptimeCheck.bulkWrite(bulkOps, {
			ordered: false, // Allow parallel processing
		});
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createDistributedChecks";
		throw error;
	}
};

const deleteDistributedChecksByMonitorId = async (monitorId) => {
	try {
		const result = await DistributedUptimeCheck.deleteMany({ monitorId });
		return result.deletedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteDistributedChecksByMonitorId";
		throw error;
	}
};

export {
	createDistributedCheck,
	createDistributedChecks,
	deleteDistributedChecksByMonitorId,
};
