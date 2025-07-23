import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "LogController";

class LogController {
	constructor(logger) {
		this.logger = logger;
	}

	getLogs = asyncHandler(
		async (req, res, next) => {
			const logs = await this.logger.getLogs();
			res.success({
				msg: "Logs fetched successfully",
				data: logs,
			});
		},
		SERVICE_NAME,
		"getLogs"
	);
}
export default LogController;
