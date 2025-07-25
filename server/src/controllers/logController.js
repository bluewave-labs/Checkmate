import BaseController from "./baseController.js";
const SERVICE_NAME = "LogController";

class LogController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;
	constructor(commonDependencies) {
		super(commonDependencies);
	}

	get serviceName() {
		return LogController.SERVICE_NAME;
	}

	getLogs = this.asyncHandler(
		async (req, res) => {
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
