// import StatusPage from "../../models/StatusPage.js";
// import { NormalizeData } from "../../../utils/dataUtils.js";
// import ServiceRegistry from "../../../service/system/serviceRegistry.js";
// import StringService from "../../../service/system/stringService.js";

const SERVICE_NAME = "statusPageModule";

class StatusPageModule {
	constructor({ StatusPage, NormalizeData, stringService }) {
		this.StatusPage = StatusPage;
		this.NormalizeData = NormalizeData;
		this.stringService = stringService;
	}

	createStatusPage = async ({ statusPageData, image, userId, teamId }) => {
		try {
			const statusPage = new this.StatusPage({
				...statusPageData,
				userId,
				teamId,
			});
			if (image) {
				statusPage.logo = {
					data: image.buffer,
					contentType: image.mimetype,
				};
			}
			await statusPage.save();
			return statusPage;
		} catch (error) {
			if (error?.code === 11000) {
				// Handle duplicate URL errors
				error.status = 400;
				error.message = this.stringService.statusPageUrlNotUnique;
			}
			error.service = SERVICE_NAME;
			error.method = "createStatusPage";
			throw error;
		}
	};

	updateStatusPage = async (statusPageData, image) => {
		try {
			if (image) {
				statusPageData.logo = {
					data: image.buffer,
					contentType: image.mimetype,
				};
			} else {
				statusPageData.logo = null;
			}

			if (statusPageData.deleteSubmonitors === "true") {
				statusPageData.subMonitors = [];
			}
			const statusPage = await this.StatusPage.findOneAndUpdate({ url: statusPageData.url }, statusPageData, {
				new: true,
			});

			return statusPage;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateStatusPage";
			throw error;
		}
	};

	getStatusPageByUrl = async (url) => {
		// TODO This is deprecated, can remove and have controller call getStatusPage
		try {
			return this.getStatusPage(url);
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getStatusPageByUrl";
			throw error;
		}
	};

	getStatusPagesByTeamId = async (teamId) => {
		try {
			const statusPages = await this.StatusPage.find({ teamId });
			return statusPages;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getStatusPagesByTeamId";
			throw error;
		}
	};

	getStatusPage = async (url) => {
		try {
			const preliminaryStatusPage = await this.StatusPage.findOne({ url });
			if (!preliminaryStatusPage) {
				const error = new Error(this.stringService.statusPageNotFound);
				error.status = 404;
				throw error;
			}

			if (!preliminaryStatusPage.monitors || preliminaryStatusPage.monitors.length === 0) {
				const { _id, color, companyName, isPublished, logo, originalMonitors, showCharts, showUptimePercentage, timezone, showAdminLoginLink, url } =
					preliminaryStatusPage;
				return {
					statusPage: {
						_id,
						color,
						companyName,
						isPublished,
						logo,
						originalMonitors,
						showCharts,
						showUptimePercentage,
						timezone,
						showAdminLoginLink,
						url,
					},
					monitors: [],
				};
			}

			const statusPageQuery = await this.StatusPage.aggregate([
				{ $match: { url: url } },
				{
					$set: {
						originalMonitors: "$monitors",
					},
				},
				{
					$lookup: {
						from: "monitors",
						localField: "monitors",
						foreignField: "_id",
						as: "monitors",
					},
				},
				{
					$unwind: {
						path: "$monitors",
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$lookup: {
						from: "maintenancewindows",
						let: { monitorId: "$monitors._id" },
						pipeline: [{ $match: { $expr: { $eq: ["$monitorId", "$$monitorId"] } } }],
						as: "monitors.maintenanceWindows",
					},
				},
				{
					$lookup: {
						from: "checks",
						let: { monitorId: "$monitors._id" },
						pipeline: [
							{
								$match: {
									$expr: { $eq: ["$monitorId", "$$monitorId"] },
								},
							},
							{ $sort: { createdAt: -1 } },
							{ $limit: 25 },
						],
						as: "monitors.checks",
					},
				},
				{
					$addFields: {
						"monitors.orderIndex": {
							$indexOfArray: ["$originalMonitors", "$monitors._id"],
						},
						"monitors.isMaintenance": {
							$reduce: {
								input: "$monitors.maintenanceWindows",
								initialValue: false,
								in: {
									$or: [
										"$$value",
										{
											$and: [
												{ $eq: ["$$this.active", true] },
												{
													$or: [
														// Non-repeating window: simple time check
														{
															$and: [{ $eq: ["$$this.repeat", 0] }, { $lte: ["$$this.start", "$$NOW"] }, { $gte: ["$$this.end", "$$NOW"] }],
														},
														// Repeating window: calculate current occurrence
														{
															$and: [
																{ $ne: ["$$this.repeat", 0] },
																{ $gt: ["$$this.repeat", 0] },
																{
																	$let: {
																		vars: {
																			timeSinceStart: { $subtract: ["$$NOW", "$$this.start"] },
																			windowDuration: { $subtract: ["$$this.end", "$$this.start"] },
																		},
																		in: {
																			$and: [
																				{ $gte: ["$$timeSinceStart", 0] }, // Started
																				{
																					$lte: [{ $mod: ["$$timeSinceStart", "$$this.repeat"] }, "$$windowDuration"],
																				},
																			],
																		},
																	},
																},
															],
														},
													],
												},
											],
										},
									],
								},
							},
						},
					},
				},
				{ $match: { "monitors.orderIndex": { $ne: -1 } } },
				{ $sort: { "monitors.orderIndex": 1 } },

				{
					$group: {
						_id: "$_id",
						statusPage: { $first: "$$ROOT" },
						monitors: { $push: "$monitors" },
					},
				},
				{
					$project: {
						statusPage: {
							_id: 1,
							color: 1,
							companyName: 1,
							isPublished: 1,
							logo: 1,
							originalMonitors: 1,
							showCharts: 1,
							showUptimePercentage: 1,
							timezone: 1,
							showAdminLoginLink: 1,
							url: 1,
						},
						monitors: {
							_id: 1,
							userId: 1,
							teamId: 1,
							name: 1,
							description: 1,
							status: 1,
							type: 1,
							ignoreTlsErrors: 1,
							jsonPath: 1,
							expectedValue: 1,
							matchMethod: 1,
							url: 1,
							port: 1,
							isActive: 1,
							interval: 1,
							uptimePercentage: 1,
							notifications: 1,
							secret: 1,
							thresholds: 1,
							alertThreshold: 1,
							cpuAlertThreshold: 1,
							memoryAlertThreshold: 1,
							diskAlertThreshold: 1,
							tempAlertThreshold: 1,
							checks: 1,
							isMaintenance: 1,
							createdAt: 1,
							updatedAt: 1,
						},
					},
				},
			]);
			if (!statusPageQuery.length) {
				const error = new Error(this.stringService.statusPageNotFound);
				error.status = 404;
				throw error;
			}

			const { statusPage, monitors } = statusPageQuery[0];

			const normalizedMonitors = monitors.map((monitor) => {
				return {
					...monitor,
					checks: this.NormalizeData(monitor.checks, 10, 100),
				};
			});

			return { statusPage, monitors: normalizedMonitors };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getStatusPageByUrl";
			throw error;
		}
	};

	deleteStatusPage = async (url) => {
		try {
			await this.StatusPage.deleteOne({ url });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteStatusPage";
			throw error;
		}
	};
	deleteStatusPagesByMonitorId = async (monitorId) => {
		try {
			await this.StatusPage.deleteMany({ monitors: { $in: [monitorId] } });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteStatusPageByMonitorId";
			throw error;
		}
	};
}

export default StatusPageModule;
