import { ILogger } from "@/utils/logger.js";
import { Request, Response, RequestHandler } from "express";

export interface ILogController {
	getLogs: RequestHandler;
}

class LogController {
	private logger: ILogger;
	constructor(logger: ILogger) {
		this.logger = logger;
	}

	getLogs = async (req: Request, res: Response) => {
		const data = this.logger.getLogs();
		res.json({ success: true, msg: "Logs fetched successfully", data });
	};
}
export default LogController;
