import { ObjectId } from "mongodb";
import { buildChecksSummaryByTeamIdPipeline } from "./checkModuleQueries.js";

const SERVICE_NAME = "checkModule";
const dateRangeLookup = {
	recent: new Date(new Date().setDate(new Date().getDate() - 2)),
	hour: new Date(new Date().setHours(new Date().getHours() - 1)),
	day: new Date(new Date().setDate(new Date().getDate() - 1)),
	week: new Date(new Date().setDate(new Date().getDate() - 7)),
	month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
	all: undefined,
};

class CheckModule {
	constructor({ logger, Check, HardwareCheck, PageSpeedCheck, Monitor, User }) {
		this.logger = logger;
		this.Check = Check;
		this.HardwareCheck = HardwareCheck;
		this.PageSpeedCheck = PageSpeedCheck;
		this.Monitor = Monitor;
		this.User = User;
	}

	createChecks = async (checks) => {
		try {
			await this.Check.insertMany(checks, { ordered: false });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createCheck";
			throw error;
		}
	};

	getChecksByMonitor = async ({ monitorId, type, sortOrder, dateRange, filter, ack, page, rowsPerPage, status }) => {
		try {
			status = status === "true" ? true : status === "false" ? false : undefined;
			page = parseInt(page);
			rowsPerPage = parseInt(rowsPerPage);

			const ackStage = ack === "true" ? { ack: true } : { $or: [{ ack: false }, { ack: { $exists: false } }] };

			// Match
			const matchStage = {
				monitorId: new ObjectId(monitorId),
				...(typeof status !== "undefined" && { status }),
				...(typeof ack !== "undefined" && ackStage),
				...(dateRangeLookup[dateRange] && {
					createdAt: {
						$gte: dateRangeLookup[dateRange],
					},
				}),
			};

			if (filter !== undefined) {
				switch (filter) {
					case "all":
						break;
					case "down":
						break;
					case "resolve":
						matchStage.statusCode = 5000;
						break;
					default:
						this.logger.warn({
							message: "invalid filter",
							service: SERVICE_NAME,
							method: "getChecks",
						});
						break;
				}
			}

			//Sort
			sortOrder = sortOrder === "asc" ? 1 : -1;

			// Pagination
			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			const checkModels = {
				http: this.Check,
				ping: this.Check,
				docker: this.Check,
				port: this.Check,
				pagespeed: this.PageSpeedCheck,
				hardware: this.HardwareCheck,
				game: this.Check,
			};

			const Model = checkModels[type];

			const checks = await Model.aggregate([
				{ $match: matchStage },
				{ $sort: { createdAt: sortOrder } },
				{
					$facet: {
						summary: [{ $count: "checksCount" }],
						checks: [{ $skip: skip }, { $limit: rowsPerPage }],
					},
				},
				{
					$project: {
						checksCount: {
							$ifNull: [{ $arrayElemAt: ["$summary.checksCount", 0] }, 0],
						},
						checks: {
							$ifNull: ["$checks", []],
						},
					},
				},
			]);
			return checks[0];
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getChecks";
			throw error;
		}
	};

	getChecksByTeam = async ({ sortOrder, dateRange, filter, ack, page, rowsPerPage, teamId }) => {
		try {
			page = parseInt(page);
			rowsPerPage = parseInt(rowsPerPage);

			const ackStage = ack === "true" ? { ack: true } : { $or: [{ ack: false }, { ack: { $exists: false } }] };

			const matchStage = {
				teamId: new ObjectId(teamId),
				status: false,
				...(typeof ack !== "undefined" && ackStage),
				...(dateRangeLookup[dateRange] && {
					createdAt: {
						$gte: dateRangeLookup[dateRange],
					},
				}),
			};
			// Add filter to match stage
			if (filter !== undefined) {
				switch (filter) {
					case "all":
						break;
					case "down":
						break;
					case "resolve":
						matchStage.statusCode = 5000;
						break;
					default:
						this.logger.warn({
							message: "invalid filter",
							service: SERVICE_NAME,
							method: "getChecksByTeam",
						});
						break;
				}
			}

			sortOrder = sortOrder === "asc" ? 1 : -1;

			// pagination
			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			const aggregatePipeline = [
				{ $match: matchStage },
				{
					$unionWith: {
						coll: "hardwarechecks",
						pipeline: [{ $match: matchStage }],
					},
				},
				{
					$unionWith: {
						coll: "pagespeedchecks",
						pipeline: [{ $match: matchStage }],
					},
				},

				{ $sort: { createdAt: sortOrder } },
				{
					$facet: {
						summary: [{ $count: "checksCount" }],
						checks: [{ $skip: skip }, { $limit: rowsPerPage }],
					},
				},
				{
					$project: {
						checksCount: { $arrayElemAt: ["$summary.checksCount", 0] },
						checks: "$checks",
					},
				},
			];

			const checks = await this.Check.aggregate(aggregatePipeline);
			return checks[0];
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getChecksByTeam";
			throw error;
		}
	};

	ackCheck = async (checkId, teamId, ack) => {
		try {
			const updatedCheck = await this.Check.findOneAndUpdate({ _id: checkId, teamId: teamId }, { $set: { ack, ackAt: new Date() } }, { new: true });

			if (!updatedCheck) {
				throw new Error("Check not found");
			}

			return updatedCheck;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "ackCheck";
			throw error;
		}
	};

	ackAllChecks = async (monitorId, teamId, ack, path) => {
		try {
			const updatedChecks = await this.Check.updateMany(path === "monitor" ? { monitorId } : { teamId }, { $set: { ack, ackAt: new Date() } });
			return updatedChecks.modifiedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "ackAllChecks";
			throw error;
		}
	};

	getChecksSummaryByTeamId = async ({ teamId }) => {
		try {
			const matchStage = {
				teamId: new ObjectId(teamId),
			};
			const checks = await this.Check.aggregate(buildChecksSummaryByTeamIdPipeline({ matchStage }));
			return checks[0].summary;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getChecksSummaryByTeamId";
			throw error;
		}
	};
	deleteChecks = async (monitorId) => {
		try {
			const result = await this.Check.deleteMany({ monitorId });
			return result.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteChecks";
			throw error;
		}
	};

	deleteChecksByTeamId = async (teamId) => {
		try {
			// Find all monitor IDs for this team (only get _id field for efficiency)
			const teamMonitors = await this.Monitor.find({ teamId }, { _id: 1 });
			const monitorIds = teamMonitors.map((monitor) => monitor._id);

			// Delete all checks for these monitors in one operation
			const deleteResult = await this.Check.deleteMany({ monitorId: { $in: monitorIds } });

			return deleteResult.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteChecksByTeamId";
			throw error;
		}
	};

	updateChecksTTL = async (teamId, ttl) => {
		try {
			await this.Check.collection.dropIndex("expiry_1");
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "updateChecksTTL",
				stack: error.stack,
			});
		}

		try {
			await this.Check.collection.createIndex(
				{ expiry: 1 },
				{ expireAfterSeconds: ttl } // TTL in seconds, adjust as necessary
			);
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateChecksTTL";
			throw error;
		}
		// Update user
		try {
			await this.User.updateMany({ teamId: teamId }, { checkTTL: ttl });
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "updateChecksTTL";
			throw error;
		}
	};
}

export default CheckModule;
