import { ILogger } from "@/utils/logger.js";
import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "LogController";

export interface ILogController {
	getLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

class LogController {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	constructor(logger: ILogger) {
		this.logger = logger;
	}
	get serviceName() {
		return LogController.SERVICE_NAME;
	}

	getLogs = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const logs = this.logger.getLogs();
			res.status(200).json({
				success: true,
				msg: "Logs fetched successfully",
				data: logs,
			});
		} catch (error) {
			next(error);
		}
	};
}
export default LogController;
