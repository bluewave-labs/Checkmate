import { IDiagnosticService } from "@/service/index.js";
import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "diagnosticController";

export interface IDiagnosticController {
	getSystemStats: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}

class DiagnosticController implements IDiagnosticController {
	static SERVICE_NAME = SERVICE_NAME;

	private diagnosticService: IDiagnosticService;

	constructor(diagnosticService: IDiagnosticService) {
		this.diagnosticService = diagnosticService;
	}

	get serviceName() {
		return DiagnosticController.SERVICE_NAME;
	}

	getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const diagnostics = await this.diagnosticService.getSystemStats();
			return res.status(200).json({
				success: true,
				msg: "OK",
				data: diagnostics,
			});
		} catch (error) {
			next(error);
		}
	};
}

export default DiagnosticController;
