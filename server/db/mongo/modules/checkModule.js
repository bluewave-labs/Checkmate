import Check from "../../models/Check.js";
import Monitor from "../../models/Monitor.js";
import HardwareCheck from "../../models/HardwareCheck.js";
import PageSpeedCheck from "../../models/PageSpeedCheck.js";
import User from "../../models/User.js";
import logger from "../../../utils/logger.js";
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

/**
 * Create a check for a monitor
 * @async
 * @param {Object} checkData
 * @param {string} checkData.monitorId
 * @param {boolean} checkData.status
 * @param {number} checkData.responseTime
 * @param {number} checkData.statusCode
 * @param {string} checkData.message
 * @returns {Promise<Check>}
 * @throws {Error}
 */

const createCheck = async (checkData) => {
	try {
		const check = await new Check({ ...checkData }).save();
		return check;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createCheck";
		throw error;
	}
};

const createChecks = async (checks) => {
	try {
		await Check.insertMany(checks, { ordered: false });
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createCheck";
		throw error;
	}
};

/**
 * Get all checks for a monitor
 * @async
 * @param {string} monitorId
 * @returns {Promise<Array<Check>>}
 * @throws {Error}
 */
const getChecksByMonitor = async ({ monitorId, type, sortOrder, dateRange, filter, ack, page, rowsPerPage, status }) => {
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
					logger.warn({
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
			http: Check,
			ping: Check,
			docker: Check,
			port: Check,
			pagespeed: PageSpeedCheck,
			hardware: HardwareCheck,
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

const getChecksByTeam = async ({ sortOrder, dateRange, filter, ack, page, rowsPerPage, teamId }) => {
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
					logger.warn({
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

		const checks = await Check.aggregate(aggregatePipeline);
		return checks[0];
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getChecksByTeam";
		throw error;
	}
};

/**
 * Update the acknowledgment status of a check
 * @async
 * @param {string} checkId - The ID of the check to update
 * @param {string} teamId - The ID of the team
 * @param {boolean} ack - The acknowledgment status to set
 * @returns {Promise<Check>}
 * @throws {Error}
 */
const ackCheck = async (checkId, teamId, ack) => {
	try {
		const updatedCheck = await Check.findOneAndUpdate({ _id: checkId, teamId: teamId }, { $set: { ack, ackAt: new Date() } }, { new: true });

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

/**
 * Update the acknowledgment status of all checks for a monitor or team
 * @async
 * @param {string} id - The monitor ID or team ID
 * @param {boolean} ack - The acknowledgment status to set
 * @param {string} path - The path type ('monitor' or 'team')
 * @returns {Promise<number>}
 * @throws {Error}
 */
const ackAllChecks = async (monitorId, teamId, ack, path) => {
	try {
		const updatedChecks = await Check.updateMany(path === "monitor" ? { monitorId } : { teamId }, { $set: { ack, ackAt: new Date() } });
		return updatedChecks.modifiedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "ackAllChecks";
		throw error;
	}
};

/**
 * Get checks and summary by team ID
 * @async
 * @param {string} teamId
 * @returns {Promise<Object>}
 * @throws {Error}
 */
const getChecksSummaryByTeamId = async ({ teamId }) => {
	try {
		const matchStage = {
			teamId: new ObjectId(teamId),
		};
		const checks = await Check.aggregate(buildChecksSummaryByTeamIdPipeline({ matchStage }));
		return checks[0].summary;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getChecksSummaryByTeamId";
		throw error;
	}
};

/**
 * Delete all checks for a monitor
 * @async
 * @param {string} monitorId
 * @returns {number}
 * @throws {Error}
 */

const deleteChecks = async (monitorId) => {
	try {
		const result = await Check.deleteMany({ monitorId });
		return result.deletedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteChecks";
		throw error;
	}
};

/**
 * Delete all checks for a team
 * @async
 * @param {string} monitorId
 * @returns {number}
 * @throws {Error}
 */

const deleteChecksByTeamId = async (teamId) => {
	try {
		// Find all monitor IDs for this team (only get _id field for efficiency)
		const teamMonitors = await Monitor.find({ teamId }, { _id: 1 });
		const monitorIds = teamMonitors.map((monitor) => monitor._id);

		// Delete all checks for these monitors in one operation
		const deleteResult = await Check.deleteMany({ monitorId: { $in: monitorIds } });

		return deleteResult.deletedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteChecksByTeamId";
		throw error;
	}
};

const updateChecksTTL = async (teamId, ttl) => {
	try {
		await Check.collection.dropIndex("expiry_1");
	} catch (error) {
		logger.error({
			message: error.message,
			service: SERVICE_NAME,
			method: "updateChecksTTL",
			stack: error.stack,
		});
	}

	try {
		await Check.collection.createIndex(
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
		await User.updateMany({ teamId: teamId }, { checkTTL: ttl });
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "updateChecksTTL";
		throw error;
	}
};

export {
	createCheck,
	createChecks,
	getChecksByMonitor,
	getChecksByTeam,
	ackCheck,
	ackAllChecks,
	getChecksSummaryByTeamId,
	deleteChecks,
	deleteChecksByTeamId,
	updateChecksTTL,
};
