import { handleError } from "./controllerUtils.js";

const SERVICE_NAME = "JobQueueController";

class LogController {
	constructor(logger) {
		this.logger = logger;
	}

	getLogs = async (req, res, next) => {
		try {
			const logs = await this.logger.getLogs();
			res.success({
				msg: "Logs fetched successfully",
				data: logs,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getMetrics"));
			return;
		}
	};
}
export default LogController;
