import { ILogger } from "@/utils/logger.js";
import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";

export interface ILogController {
	getLogs: RequestHandler;
}

class LogController implements ILogController {
	private logger: ILogger;
	constructor(logger: ILogger) {
		this.logger = logger;
	}

	getLogs: Handler = async (req, res) => {
		const data = this.logger.getLogs();
		res.json({ success: true, msg: "Logs fetched successfully", data });
	};
}
export default LogController;
