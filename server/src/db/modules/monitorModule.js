import {
	buildUptimeDetailsPipeline,
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildMonitorsAndSummaryByTeamIdPipeline,
	buildMonitorsWithChecksByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
	getHardwareStats,
	getUpChecks,
	getAggregateData,
} from "./monitorModuleQueries.js";

import { CheckModel } from "@/db/models/index.js";

const SERVICE_NAME = "monitorModule";

class MonitorModule {
	constructor({ Monitor, MonitorStats, stringService, fs, path, fileURLToPath, ObjectId, NormalizeData, NormalizeDataUptimeDetails }) {
		this.Monitor = Monitor;
		this.MonitorStats = MonitorStats;
		this.stringService = stringService;
		this.fs = fs;
		this.path = path;
		this.fileURLToPath = fileURLToPath;
		this.ObjectId = ObjectId;
		this.NormalizeData = NormalizeData;
		this.NormalizeDataUptimeDetails = NormalizeDataUptimeDetails;

		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);

		this.demoMonitorsPath = path.resolve(__dirname, "../../../utils/demoMonitors.json");
	}

	// Helper
	calculateUptimeDuration = (checks) => {
		if (!checks || checks.length === 0) {
			return 0;
		}
		const latestCheck = new Date(checks[0].createdAt);
		let latestDownCheck = 0;

		for (let i = checks.length - 1; i >= 0; i--) {
			if (checks[i].status === false) {
				latestDownCheck = new Date(checks[i].createdAt);
				break;
			}
		}

		// If no down check is found, uptime is from the last check to now
		if (latestDownCheck === 0) {
			return Date.now() - new Date(checks[checks.length - 1].createdAt);
		}

		// Otherwise the uptime is from the last check to the last down check
		return latestCheck - latestDownCheck;
	};

	// Helper
	getLastChecked = (checks) => {
		if (!checks || checks.length === 0) {
			return 0; // Handle case when no checks are available
		}
		// Data is sorted newest->oldest, so last check is the most recent
		return new Date() - new Date(checks[0].createdAt);
	};
	getLatestResponseTime = (checks) => {
		if (!checks || checks.length === 0) {
			return 0;
		}

		return checks[0]?.responseTime ?? 0;
	};

	// Helper
	getAverageResponseTime = (checks) => {
		if (!checks || checks.length === 0) {
			return 0;
		}

		const validChecks = checks.filter((check) => typeof check.responseTime === "number");
		if (validChecks.length === 0) {
			return 0;
		}
		const aggResponseTime = validChecks.reduce((sum, check) => {
			return sum + check.responseTime;
		}, 0);
		return aggResponseTime / validChecks.length;
	};

	// Helper
	getUptimePercentage = (checks) => {
		if (!checks || checks.length === 0) {
			return 0;
		}
		const upCount = checks.reduce((count, check) => {
			return check.status === true ? count + 1 : count;
		}, 0);
		return (upCount / checks.length) * 100;
	};

	// Helper
	getIncidents = (checks) => {
		if (!checks || checks.length === 0) {
			return 0; // Handle case when no checks are available
		}
		return checks.reduce((acc, check) => {
			return check.status === false ? (acc += 1) : acc;
		}, 0);
	};

	// Helper
	getDateRange = (dateRange) => {
		const startDates = {
			recent: new Date(new Date().setHours(new Date().getHours() - 2)),
			day: new Date(new Date().setDate(new Date().getDate() - 1)),
			week: new Date(new Date().setDate(new Date().getDate() - 7)),
			month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
			all: new Date(0),
		};
		return {
			start: startDates[dateRange],
			end: new Date(),
		};
	};

	//Helper
	getMonitorChecks = async (monitorId, dateRange, sortOrder) => {
		const objectId = new this.ObjectId(monitorId);
		const indexSpec = {
			"metadata.monitorId": 1,
			updatedAt: sortOrder,
		};

		const matchBase = { "metadata.monitorId": objectId };

		const [checksAll, checksForDateRange] = await Promise.all([
			CheckModel.find(matchBase).sort({ createdAt: sortOrder }).hint(indexSpec).lean(),
			CheckModel.find({
				...matchBase,
				createdAt: { $gte: dateRange.start, $lte: dateRange.end },
			})
				.hint(indexSpec)
				.lean(),
		]);

		return { checksAll, checksForDateRange };
	};

	// Helper
	processChecksForDisplay = (normalizeData, checks, numToDisplay, normalize) => {
		let processedChecks = checks;
		if (numToDisplay && checks.length > numToDisplay) {
			const n = Math.ceil(checks.length / numToDisplay);
			processedChecks = checks.filter((_, index) => index % n === 0);
		}
		return normalize ? normalizeData(processedChecks, 1, 100) : processedChecks;
	};

	// Helper
	groupChecksByTime = (checks, dateRange) => {
		return checks.reduce((acc, check) => {
			// Validate the date
			const checkDate = new Date(check.createdAt);
			if (Number.isNaN(checkDate.getTime()) || checkDate.getTime() === 0) {
				return acc;
			}

			const time = dateRange === "day" ? checkDate.setMinutes(0, 0, 0) : checkDate.toISOString().split("T")[0];

			if (!acc[time]) {
				acc[time] = { time, checks: [] };
			}
			acc[time].checks.push(check);
			return acc;
		}, {});
	};

	// Helper
	calculateGroupStats = (group) => {
		const totalChecks = group.checks.length;

		const checksWithResponseTime = group.checks.filter((check) => typeof check.responseTime === "number" && !Number.isNaN(check.responseTime));

		return {
			time: group.time,
			uptimePercentage: this.getUptimePercentage(group.checks),
			totalChecks,
			totalIncidents: group.checks.filter((check) => !check.status).length,
			avgResponseTime:
				checksWithResponseTime.length > 0
					? checksWithResponseTime.reduce((sum, check) => sum + check.responseTime, 0) / checksWithResponseTime.length
					: 0,
		};
	};

	getMonitorById = async (monitorId) => {
		try {
			const monitor = await this.Monitor.findById(monitorId);
			if (monitor === null || monitor === undefined) {
				const error = new Error(this.stringService.getDbFindMonitorById(monitorId));
				error.status = 404;
				throw error;
			}

			return monitor;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMonitorById";
			throw error;
		}
	};

	getMonitorsByIds = async (monitorIds) => {
		try {
			const objectIds = monitorIds.map((id) => new this.ObjectId(id));
			return await this.Monitor.find({ _id: { $in: objectIds } }, { _id: 1, teamId: 1 }).lean();
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMonitorsByIds";
			throw error;
		}
	};
	getUptimeDetailsById = async ({ monitorId, dateRange }) => {
		try {
			const dates = this.getDateRange(dateRange);
			const formatLookup = {
				recent: "%Y-%m-%dT%H:%M:00Z",
				day: "%Y-%m-%dT%H:00:00Z",
				week: "%Y-%m-%dT00:00:00Z",
				month: "%Y-%m-%dT00:00:00Z",
			};

			const dateString = formatLookup[dateRange];

			const results = await CheckModel.aggregate(buildUptimeDetailsPipeline(monitorId, dates, dateString));

			const monitorData = results[0];

			monitorData.groupedUpChecks = this.NormalizeDataUptimeDetails(monitorData.groupedUpChecks, 10, 100);

			monitorData.groupedDownChecks = this.NormalizeDataUptimeDetails(monitorData.groupedDownChecks, 10, 100);

			const normalizedGroupChecks = this.NormalizeDataUptimeDetails(monitorData.groupedChecks, 10, 100);

			monitorData.groupedChecks = normalizedGroupChecks;
			const monitorStats = await this.MonitorStats.findOne({ monitorId });
			return { monitorData, monitorStats };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getUptimeDetailsById";
			throw error;
		}
	};

	getHardwareDetailsById = async ({ monitorId, dateRange }) => {
		try {
			const monitor = await this.Monitor.findById(monitorId);
			const dates = this.getDateRange(dateRange);

			const formatLookup = {
				recent: "%Y-%m-%dT%H:%M:00Z",
				day: "%Y-%m-%dT%H:00:00Z",
				week: "%Y-%m-%dT00:00:00Z",
				month: "%Y-%m-%dT00:00:00Z",
			};
			const dateString = formatLookup[dateRange];

			const [aggregateData, upChecksCount, metrics] = await Promise.all([
				getAggregateData(monitorId, dates),
				getUpChecks(monitorId, dates),
				getHardwareStats(monitorId, dates, dateString),
			]);

			const stats = {
				aggregateData: aggregateData,
				upChecks: upChecksCount,
				checks: metrics,
			};

			return {
				...monitor.toObject(),
				stats,
			};
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getHardwareDetailsById";
			throw error;
		}
	};

	getMonitorsByTeamId = async ({ teamId, type, filter }) => {
		try {
			const matchStage = { teamId: new this.ObjectId(teamId) };
			if (type !== undefined) {
				matchStage.type = Array.isArray(type) ? { $in: type } : type;
			}
			if (filter !== undefined && filter !== null && filter !== "") {
				matchStage.$or = [{ name: { $regex: filter, $options: "i" } }, { url: { $regex: filter, $options: "i" } }];
			}
			const monitors = await this.Monitor.find(matchStage)
				.sort({ name: 1 })
				.select({
					_id: 1,
					name: 1,
					type: 1,
					url: 1,
					status: 1,
					isActive: 1,
					teamId: 1,
				})
				.lean();
			return monitors;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMonitorsByTeamId";
			throw error;
		}
	};

	getMonitorsAndSummaryByTeamId = async ({ type, explain, teamId }) => {
		try {
			const matchStage = { teamId: new this.ObjectId(teamId) };
			if (type !== undefined) {
				matchStage.type = Array.isArray(type) ? { $in: type } : type;
			}

			if (explain === true) {
				return this.Monitor.aggregate(buildMonitorsAndSummaryByTeamIdPipeline({ matchStage })).explain("executionStats");
			}

			const queryResult = await this.Monitor.aggregate(buildMonitorsAndSummaryByTeamIdPipeline({ matchStage }));
			const { monitors, summary } = queryResult?.[0] ?? {};
			return { monitors, summary };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMonitorsAndSummaryByTeamId";
			throw error;
		}
	};

	getMonitorsWithChecksByTeamId = async ({ limit, type, page, rowsPerPage, filter, field, order, teamId, explain }) => {
		try {
			limit = parseInt(limit);
			page = parseInt(page);
			rowsPerPage = parseInt(rowsPerPage);
			if (field === undefined) {
				field = "name";
				order = "asc";
			}
			// Build match stage
			const matchStage = { teamId: new this.ObjectId(teamId) };
			if (type !== undefined) {
				matchStage.type = Array.isArray(type) ? { $in: type } : type;
			}

			if (explain === true) {
				return this.Monitor.aggregate(
					buildMonitorsWithChecksByTeamIdPipeline({
						matchStage,
						filter,
						page,
						rowsPerPage,
						field,
						order,
						limit,
						type,
					})
				).explain("executionStats");
			}

			const queryResult = await this.Monitor.aggregate(
				buildMonitorsWithChecksByTeamIdPipeline({
					matchStage,
					filter,
					page,
					rowsPerPage,
					field,
					order,
					limit,
					type,
				})
			);
			const monitors = queryResult[0]?.monitors;
			const count = queryResult[0]?.count;
			const normalizedFilteredMonitors = monitors.map((monitor) => {
				if (!monitor.checks) {
					return monitor;
				}
				monitor.checks = this.NormalizeData(monitor.checks, 10, 100);
				return monitor;
			});
			return { count, monitors: normalizedFilteredMonitors };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMonitorsWithChecksByTeamId";
			throw error;
		}
	};
	createMonitor = async ({ body, teamId, userId }) => {
		try {
			const monitor = new this.Monitor({ ...body, teamId, userId });
			const saved = await monitor.save();
			return saved;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createMonitor";
			throw error;
		}
	};

	createBulkMonitors = async (req) => {
		try {
			const monitors = req.map((item) => new this.Monitor({ ...item, notifications: undefined }));
			await this.Monitor.bulkSave(monitors);
			return monitors;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createBulkMonitors";
			throw error;
		}
	};

	deleteMonitor = async ({ teamId, monitorId }) => {
		try {
			const deletedMonitor = await this.Monitor.findOneAndDelete({ _id: monitorId, teamId });

			if (!deletedMonitor) {
				throw new Error(this.stringService.getDbFindMonitorById(monitorId));
			}

			return deletedMonitor;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteMonitor";
			throw error;
		}
	};

	deleteAllMonitors = async (teamId) => {
		try {
			const monitors = await this.Monitor.find({ teamId });
			const { deletedCount } = await this.Monitor.deleteMany({ teamId });

			return { monitors, deletedCount };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteAllMonitors";
			throw error;
		}
	};

	deleteMonitorsByUserId = async (userId) => {
		try {
			const result = await this.Monitor.deleteMany({ userId: userId });
			return result;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteMonitorsByUserId";
			throw error;
		}
	};

	editMonitor = async ({ monitorId, body }) => {
		try {
			const editedMonitor = await this.Monitor.findByIdAndUpdate(monitorId, body, {
				new: true,
			});
			return editedMonitor;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "editMonitor";
			throw error;
		}
	};

	addDemoMonitors = async (userId, teamId) => {
		try {
			const demoMonitors = JSON.parse(this.fs.readFileSync(this.demoMonitorsPath, "utf8"));

			const demoMonitorsToInsert = demoMonitors.map((monitor) => {
				return {
					userId,
					teamId,
					name: monitor.name,
					description: monitor.name,
					type: "http",
					url: monitor.url,
					interval: 60000,
				};
			});
			const insertedMonitors = await this.Monitor.insertMany(demoMonitorsToInsert);
			return insertedMonitors;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "addDemoMonitors";
			throw error;
		}
	};

	pauseMonitor = async ({ monitorId }) => {
		try {
			const monitor = await this.Monitor.findOneAndUpdate(
				{ _id: monitorId },
				[
					{
						$set: {
							isActive: { $not: "$isActive" },
							status: "$$REMOVE",
						},
					},
				],
				{ new: true }
			);

			return monitor;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "pauseMonitor";
			throw error;
		}
	};

	getGroupsByTeamId = async ({ teamId }) => {
		try {
			const groups = await this.Monitor.distinct("group", {
				teamId: new this.ObjectId(teamId),
				group: { $ne: null, $ne: "" },
			});

			return groups.filter(Boolean).sort();
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getGroupsByTeamId";
			throw error;
		}
	};
}

export default MonitorModule;
