import { ILogger } from "@/utils/logger.js";
import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

export interface ILogController {
	getLogs: RequestHandler;
}

class LogController {
	private logger: ILogger;
	constructor(logger: ILogger) {
		this.logger = logger;
	}

	getLogs = catchAsync(async (req: Request, res: Response) => {
		const logs = this.logger.getLogs();
		res.status(200).json({
			success: true,
			msg: "Logs fetched successfully",
			data: logs,
		});
	});
}
export default LogController;
