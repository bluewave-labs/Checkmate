import { handleError } from "./controllerUtils.js";
const SERVICE_NAME = "diagnosticController";

class DiagnosticController {
	constructor(db) {
		this.db = db;
		this.getDistributedUptimeDbExecutionStats =
			this.getDistributedUptimeDbExecutionStats.bind(this);
		this.getMonitorsByTeamIdExecutionStats =
			this.getMonitorsByTeamIdExecutionStats.bind(this);
		this.getDbStats = this.getDbStats.bind(this);
	}

	async getDistributedUptimeDbExecutionStats(req, res, next) {
		try {
			const data = await this.db.getDistributedUptimeDbExecutionStats(req);
			return res.success({
				msg: "OK",
				data,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDbExecutionStats"));
		}
	}

	async getMonitorsByTeamIdExecutionStats(req, res, next) {
		try {
			const data = await this.db.getMonitorsByTeamIdExecutionStats(req);
			return res.success({
				msg: "OK",
				data,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMonitorsByTeamIdExecutionStats"));
		}
	}

	async getDbStats(req, res, next) {
		try {
			const { methodName, args = [] } = req.body;
			if (!methodName || !this.db[methodName]) {
				return res.error({
					msg: "Invalid method name or method doesn't exist",
					status: 400,
				});
			}
			const explainMethod = await this.db[methodName].apply(this.db, args);
			const stats = {
				methodName,
				timestamp: new Date(),
				explain: explainMethod,
			};
			return res.success({
				msg: "OK",
				data: stats,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDbStats"));
		}
	}
}
export default DiagnosticController;
