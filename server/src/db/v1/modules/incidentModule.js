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
			return await this.Incident.findOne({ monitorId: new ObjectId(monitorId), status: "active" });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getActiveIncidentByMonitor";
			throw error;
		}
	};

	getIncidentById = async (incidentId) => {
		try {
			return await this.Incident.findById(incidentId)
				.populate("monitorId", "name type url")
				.populate("resolvedBy", "name email");
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getIncidentById";
			throw error;
		}
	};

	resolveIncident = async (incidentId, { resolutionType = "automatic", resolvedBy = null, comment = null, endTime = new Date() } = {}) => {
		try {
			const update = {
				status: "resolved",
				endTime,
				resolutionType,
				resolvedBy,
				...(comment !== null && { comment }),
			};
			const incident = await this.Incident.findOneAndUpdate(
				{ _id: new ObjectId(incidentId) },
				{ $set: update },
				{ new: true }
			);

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

	getIncidentsByTeam = async ({ teamId, sortOrder, dateRange, filter, page, rowsPerPage, status, monitorId, resolutionType }) => {
		try {
			page = parseInt(page);
			rowsPerPage = parseInt(rowsPerPage);

			const matchStage = {
				teamId: new ObjectId(teamId),
				...(status && { status }),
				...(monitorId && { monitorId: new ObjectId(monitorId) }),
				...(resolutionType && { resolutionType }),
				...(dateRangeLookup[dateRange] && {
					startTime: {
						$gte: dateRangeLookup[dateRange],
					},
				}),
			};

			if (filter !== undefined) {
				switch (filter) {
					case "all":
						break;
					case "active":
						matchStage.status = "active";
						break;
					case "resolved":
						matchStage.status = "resolved";
						break;
					default:
						break;
				}
			}

			sortOrder = sortOrder === "asc" ? 1 : -1;

			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			const incidents = await this.Incident.aggregate([
				{ $match: matchStage },
				{ $sort: { startTime: sortOrder } },
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
							$ifNull: ["$incidents", []],
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

	getIncidentSummary = async ({ teamId, dateRange }) => {
		try {
			const matchStage = {
				teamId: new ObjectId(teamId),
				...(dateRangeLookup[dateRange] && {
					startTime: {
						$gte: dateRangeLookup[dateRange],
					},
				}),
			};

			const summary = await this.Incident.aggregate([
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
					},
				},
			]);

			const result = {
				total: 0,
				active: 0,
				resolved: 0,
				manual: 0,
			};

			summary.forEach((item) => {
				result.total += item.count;
				if (item._id === "active") {
					result.active = item.count;
				}
				if (item._id === "resolved") {
					result.resolved = item.count;
				}
				result.manual += item.manualResolutions;
			});

			return result;
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

