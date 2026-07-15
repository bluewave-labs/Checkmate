import { IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

const SERVICE_NAME = "diagnosticController";

export interface IDiagnosticController {
	getSystemStats: RequestHandler;
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

	getSystemStats = catchAsync(async (req: Request, res: Response) => {
		const diagnostics = await this.diagnosticService.getSystemStats();
		return res.status(200).json({
			success: true,
			msg: "OK",
			data: diagnostics,
		});
	});
}

export default DiagnosticController;
