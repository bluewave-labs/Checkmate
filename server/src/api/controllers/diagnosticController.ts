import { IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";

export interface IDiagnosticController {
	getSystemStats: RequestHandler;
}

class DiagnosticController implements IDiagnosticController {
	private diagnosticService: IDiagnosticService;

	constructor(diagnosticService: IDiagnosticService) {
		this.diagnosticService = diagnosticService;
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
