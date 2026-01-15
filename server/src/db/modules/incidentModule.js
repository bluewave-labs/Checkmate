import { ObjectId } from "mongodb";

const SERVICE_NAME = "incidentModule";

const dateRangeLookup = {
	recent: new Date(new Date().setDate(new Date().getDate() - 2)),
	hour: new Date(new Date().setHours(new Date().getHours() - 1)),
	day: new Date(new Date().setDate(new Date().getDate() - 1)),
	week: new Date(new Date().setDate(new Date().getDate() - 7)),
	month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
	all: undefined,
};

class IncidentModule {
	constructor({ logger, Incident, Monitor, User }) {
		this.logger = logger;
		this.Incident = Incident;
		this.Monitor = Monitor;
		this.User = User;
	}

	createIncident = async (incidentData) => {
		try {
			const incident = await this.Incident.create(incidentData);
			return incident;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createIncident";
			throw error;
		}
	};

	createIncidents = async (incidents) => {
		try {
			await this.Incident.insertMany(incidents, { ordered: false });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createIncidents";
			throw error;
		}
	};

	getActiveIncidentByMonitor = async (monitorId) => {
		try {
			return await this.Incident.findOne({ monitorId: new ObjectId(monitorId), status: true });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getActiveIncidentByMonitor";
			throw error;
		}
	};

	getActiveIncidentsByMonitors = async (monitorIds) => {
		try {
			if (!monitorIds || monitorIds.length === 0) {
				return new Map();
			}

			const objectIds = monitorIds.map((id) => new ObjectId(id));
			const incidents = await this.Incident.find({
				monitorId: { $in: objectIds },
				status: true,
			});

			const map = new Map();
			incidents.forEach((incident) => {
				const monitorIdStr = incident.monitorId.toString();
				map.set(monitorIdStr, incident);
			});

			return map;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getActiveIncidentsByMonitors";
			throw error;
		}
	};

	getLastManuallyResolvedIncident = async (monitorId) => {
		try {
			return await this.Incident.findOne({
				monitorId: new ObjectId(monitorId),
				status: false,
				resolutionType: "manual",
			})
				.sort({ endTime: -1 })
				.limit(1);
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getLastManuallyResolvedIncident";
			throw error;
		}
	};

	getIncidentById = async (incidentId) => {
		try {
			return await this.Incident.findById(incidentId).populate("monitorId", "name type url").populate("resolvedBy", "name email");
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getIncidentById";
			throw error;
		}
	};

	resolveIncident = async (incidentId, { resolutionType = "automatic", resolvedBy = null, comment = null, endTime = new Date() } = {}) => {
		try {
			const update = {
				status: false,
				endTime,
				resolutionType,
				resolvedBy,
				...(comment !== null && { comment }),
			};
			const incident = await this.Incident.findOneAndUpdate({ _id: new ObjectId(incidentId) }, { $set: update }, { new: true });

			if (!incident) {
				throw new Error("Incident not found");
			}

			return incident;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "resolveIncident";
			throw error;
		}
	};

	addCheckToIncident = async (incidentId, checkId) => {
		try {
			const incident = await this.Incident.findOneAndUpdate(
				{ _id: new ObjectId(incidentId) },
				{ $addToSet: { checks: new ObjectId(checkId) } },
				{ new: true }
			);

			if (!incident) {
				throw new Error("Incident not found");
			}

			return incident;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "addCheckToIncident";
			throw error;
		}
	};

	addChecksToIncidentsBatch = async (operations) => {
		try {
			if (!operations || operations.length === 0) {
				return;
			}

			const bulkOps = operations.map((op) => ({
				updateOne: {
					filter: { _id: new ObjectId(op.incidentId) },
					update: { $addToSet: { checks: new ObjectId(op.checkId) } },
				},
			}));

			await this.Incident.bulkWrite(bulkOps, { ordered: false });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "addChecksToIncidentsBatch";
			throw error;
		}
	};

	/**
	 * Get incidents by team with filtering
	 *
	 * STATUS PARAMETER CONTRACT (IMPORTANT - Frontend dependency):
	 * This method has an implicit contract with frontend's useFetchIncidents hook:
	 *
	 * - status === undefined: Frontend uses this to represent "all incidents" (filter === "all")
	 *   Backend applies $or logic: { status: true } OR { status: false, endTime: >= dateRange }
	 *   This shows all active incidents + resolved incidents within the date range
	 *
	 * - status === true: Frontend uses for "active incidents" (filter === "active")
	 *   Backend shows all active incidents (no date filter applied)
	 *   Active incidents are currently happening, so date range doesn't apply
	 *
	 * - status === false: Frontend uses for "resolved incidents" (filter === "resolved")
	 *   Backend filters by endTime >= dateRange
	 *   Only shows incidents that were resolved within the specified date range
	 *
	 * WARNING: Changing this logic will break frontend filtering behavior.
	 * The frontend depends on undefined status triggering the $or logic for "all incidents".
	 * This contract must be maintained when modifying either frontend or backend code.
	 *
	 * @param {Object} params - Query parameters
	 * @param {string} params.teamId - Team ID
	 * @param {string} [params.sortOrder] - Sort order (asc/desc)
	 * @param {string} [params.dateRange] - Date range filter
	 * @param {number} [params.page] - Page number
	 * @param {number} [params.rowsPerPage] - Rows per page
	 * @param {boolean|undefined} [params.status] - Status filter. undefined = all, true = active, false = resolved
	 * @param {string} [params.monitorId] - Monitor ID filter
	 * @param {string} [params.resolutionType] - Resolution type filter
	 */
	getIncidentsByTeam = async ({ teamId, sortOrder, dateRange, page, rowsPerPage, status, monitorId, resolutionType }) => {
		try {
			page = Number.isFinite(parseInt(page)) ? parseInt(page) : 0;
			rowsPerPage = Number.isFinite(parseInt(rowsPerPage)) ? parseInt(rowsPerPage) : 20;

			let statusBoolean = undefined;
			if (status !== undefined && status !== null) {
				if (typeof status === "string") {
					statusBoolean = status === "true";
				} else if (typeof status === "boolean") {
					statusBoolean = status;
				}
			}

			const matchStage = {
				teamId: new ObjectId(teamId),
				...(statusBoolean !== undefined && { status: statusBoolean }),
				...(monitorId && { monitorId: new ObjectId(monitorId) }),
				...(resolutionType && { resolutionType }),
			};

			// Date range filter logic (see contract documentation above):
			// - Active incidents (statusBoolean === true): always show (no date filter) - they're currently happening
			// - Resolved incidents (statusBoolean === false): filter by endTime (when they were resolved)
			// - All incidents (statusBoolean === undefined): show all active + resolved in the range using $or
			if (dateRangeLookup[dateRange]) {
				const dateThreshold = dateRangeLookup[dateRange];
				if (statusBoolean === true) {
					// Active incidents: show all active incidents regardless of when they started
					// No date filter applied
				} else if (statusBoolean === false) {
					// Resolved incidents: only show if resolved in the range
					matchStage.endTime = { $gte: dateThreshold };
				} else {
					// All incidents: show all active + resolved incidents in the range
					// This is the critical contract: undefined status triggers $or logic
					matchStage.$or = [
						{ status: true }, // All active incidents
						{ status: false, endTime: { $gte: dateThreshold } }, // Resolved in range
					];
				}
			}

			sortOrder = sortOrder === "asc" ? 1 : -1;

			const skip = page * rowsPerPage;

			const incidents = await this.Incident.aggregate([
				{ $match: matchStage },
				{ $sort: { startTime: sortOrder } },
				{
					$lookup: {
						from: "monitors",
						localField: "monitorId",
						foreignField: "_id",
						as: "monitor",
					},
				},
				{
					$facet: {
						summary: [{ $count: "incidentsCount" }],
						incidents: [{ $skip: skip }, { $limit: rowsPerPage }],
					},
				},
				{
					$project: {
						incidentsCount: {
							$ifNull: [{ $arrayElemAt: ["$summary.incidentsCount", 0] }, 0],
						},
						incidents: {
							$map: {
								input: { $ifNull: ["$incidents", []] },
								as: "incident",
								in: {
									$mergeObjects: [
										"$$incident",
										{
											monitorName: {
												$let: {
													vars: {
														monitor: { $arrayElemAt: ["$$incident.monitor", 0] },
													},
													in: {
														$ifNull: ["$$monitor.name", null],
													},
												},
											},
										},
									],
								},
							},
						},
					},
				},
			]);

			return incidents[0];
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getIncidentsByTeam";
			throw error;
		}
	};

	getIncidentSummary = async ({ teamId, limit = 10 }) => {
		try {
			const matchStage = {
				teamId: new ObjectId(teamId),
			};

			// Get basic counts and resolution types
			const countsPipeline = [
				{ $match: matchStage },
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
						manualResolutions: {
							$sum: {
								$cond: [{ $eq: ["$resolutionType", "manual"] }, 1, 0],
							},
						},
						automaticResolutions: {
							$sum: {
								$cond: [{ $eq: ["$resolutionType", "automatic"] }, 1, 0],
							},
						},
					},
				},
			];

			const counts = await this.Incident.aggregate(countsPipeline);

			// Calculate totals
			let total = 0;
			let active = 0;
			let resolved = 0;
			let manual = 0;
			let automatic = 0;

			counts.forEach((item) => {
				total += item.count;
				if (item._id === true) {
					active = item.count;
				}
				if (item._id === false) {
					resolved = item.count;
				}
				manual += item.manualResolutions;
				automatic += item.automaticResolutions;
			});

			// Calculate average resolution time (in milliseconds)
			const resolutionTimePipeline = [
				{ $match: { ...matchStage, status: false, endTime: { $exists: true, $ne: null } } },
				{
					$project: {
						resolutionTime: {
							$subtract: ["$endTime", "$startTime"],
						},
					},
				},
				{
					$group: {
						_id: null,
						avgResolutionTime: { $avg: "$resolutionTime" },
					},
				},
			];

			const resolutionTimeResult = await this.Incident.aggregate(resolutionTimePipeline);
			const avgResolutionTimeMs = resolutionTimeResult[0]?.avgResolutionTime || 0;
			const avgResolutionTimeHours = avgResolutionTimeMs / (1000 * 60 * 60); // Convert to hours

			// Get monitor with most incidents
			const monitorPipeline = [
				{ $match: matchStage },
				{
					$group: {
						_id: "$monitorId",
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 1 },
				{
					$lookup: {
						from: "monitors",
						localField: "_id",
						foreignField: "_id",
						as: "monitor",
					},
				},
				{
					$project: {
						monitorId: "$_id",
						count: 1,
						monitorName: { $arrayElemAt: ["$monitor.name", 0] },
					},
				},
			];

			const monitorResult = await this.Incident.aggregate(monitorPipeline);
			const topMonitor = monitorResult[0] || null;

			// Get latest incidents
			const latestIncidentsPipeline = [
				{ $match: matchStage },
				{ $sort: { createdAt: -1 } },
				{ $limit: Math.max(1, parseInt(limit) || 10) },
				{
					$lookup: {
						from: "monitors",
						localField: "monitorId",
						foreignField: "_id",
						as: "monitor",
					},
				},
				{
					$project: {
						_id: 1,
						monitorId: 1,
						monitorName: { $arrayElemAt: ["$monitor.name", 0] },
						status: 1,
						startTime: 1,
						endTime: 1,
						resolutionType: 1,
						message: 1,
						statusCode: 1,
						createdAt: 1,
					},
				},
			];

			const latestIncidents = await this.Incident.aggregate(latestIncidentsPipeline);

			return {
				totalActive: active,
				avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100, // Round to 2 decimal places
				topMonitor: topMonitor
					? {
							monitorId: topMonitor.monitorId,
							monitorName: topMonitor.monitorName,
							incidentCount: topMonitor.count,
						}
					: null,
				total: total,
				totalManualResolutions: manual,
				totalAutomaticResolutions: automatic,
				latestIncidents: latestIncidents,
			};
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getIncidentSummary";
			throw error;
		}
	};

	deleteIncidentsByMonitor = async (monitorId) => {
		try {
			const result = await this.Incident.deleteMany({ monitorId: new ObjectId(monitorId) });
			return result.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteIncidentsByMonitor";
			throw error;
		}
	};

	deleteIncidentsByTeamId = async (teamId) => {
		try {
			const teamMonitors = await this.Monitor.find({ teamId }, { _id: 1 });
			const monitorIds = teamMonitors.map((monitor) => monitor._id);
			const deleteResult = await this.Incident.deleteMany({ monitorId: { $in: monitorIds } });
			return deleteResult.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteIncidentsByTeamId";
			throw error;
		}
	};
}

export default IncidentModule;
