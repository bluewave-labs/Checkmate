import BaseController from "./baseController.js";
const SERVICE_NAME = "LogController";

class LogController extends BaseController {
	constructor(commonDependencies) {
		super(commonDependencies);
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
