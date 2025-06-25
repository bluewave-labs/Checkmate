import Monitor from "../../models/Monitor.js";
import { ObjectId } from "mongodb";

const SERVICE_NAME = "diagnosticModule";
import {
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
} from "./monitorModuleQueries.js";

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

export { getMonitorsByTeamIdExecutionStats };
