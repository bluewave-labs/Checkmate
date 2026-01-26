import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "LogController";

class LogController {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: any;
	constructor(logger: any) {
		this.logger = logger;
	}
	get serviceName() {
		return LogController.SERVICE_NAME;
	}

	getLogs = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const logs = await this.logger.getLogs();
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
