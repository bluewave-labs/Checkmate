import DistributedUptimeCheck from "../../models/DistributedUptimeCheck.js";
import Monitor from "../../models/Monitor.js";
import { ObjectId } from "mongodb";

const SERVICE_NAME = "diagnosticModule";
import {
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
	buildDePINDetailsByDateRange,
	buildDePINLatestChecks,
} from "./monitorModuleQueries.js";
import { getDateRange } from "./monitorModule.js";

const getDistributedUptimeDbExecutionStats = async (req) => {
	try {
		const { monitorId } = req?.params ?? {};
		if (typeof monitorId === "undefined") {
			throw new Error();
		}
		const monitor = await Monitor.findById(monitorId);
		if (monitor === null || monitor === undefined) {
			throw new Error(this.stringService.dbFindMonitorById(monitorId));
		}

		const { dateRange } = req.query;
		const dates = getDateRange(dateRange);
		const formatLookup = {
			recent: "%Y-%m-%dT%H:%M:00Z",
			day: {
				$concat: [
					{ $dateToString: { format: "%Y-%m-%dT%H:", date: "$createdAt" } },
					{
						$cond: [{ $lt: [{ $minute: "$createdAt" }, 30] }, "00:00Z", "30:00Z"],
					},
				],
			},
			week: "%Y-%m-%dT%H:00:00Z",
			month: "%Y-%m-%dT00:00:00Z",
		};

		const dateString = formatLookup[dateRange];

		const dePINDetailsByDateRangeStats = await DistributedUptimeCheck.aggregate(
			buildDePINDetailsByDateRange(monitor, dates, dateString)
		).explain("executionStats");
		const latestChecksStats = await DistributedUptimeCheck.aggregate(
			buildDePINLatestChecks(monitor)
		).explain("executionStats");

		return {
			dePINDetailsByDateRangeStats,
			latestChecksStats,
		};
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getAllMonitorsWithUptimeStats";
		throw error;
	}
};

const getMonitorsByTeamIdExecutionStats = async (req) => {
	try {
		let { limit, type, page, rowsPerPage, filter, field, order } = req.query;
		limit = parseInt(limit);
		page = parseInt(page);
		rowsPerPage = parseInt(rowsPerPage);
		if (field === undefined) {
			field = "name";
			order = "asc";
		}
		// Build match stage
		const matchStage = { teamId: ObjectId.createFromHexString(req.params.teamId) };
		if (type !== undefined) {
			matchStage.type = Array.isArray(type) ? { $in: type } : type;
		}

		const summary = await Monitor.aggregate(
			buildMonitorSummaryByTeamIdPipeline({ matchStage })
		).explain("executionStats");

		const monitors = await Monitor.aggregate(
			buildMonitorsByTeamIdPipeline({ matchStage, field, order })
		).explain("executionStats");

		const filteredMonitors = await Monitor.aggregate(
			buildFilteredMonitorsByTeamIdPipeline({
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

		return { summary, monitors, filteredMonitors };
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getMonitorSummaryByTeamIdExecutionStats";
		throw error;
	}
};

export { getDistributedUptimeDbExecutionStats, getMonitorsByTeamIdExecutionStats };
