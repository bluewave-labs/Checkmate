import { IDiagnosticService } from "@/domain/diagnostics/diagnostic.service.js";
import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";

export interface IDiagnosticController {
	getSystemStats: RequestHandler;
}

class DiagnosticController implements IDiagnosticController {
	private diagnosticService: IDiagnosticService;

	constructor(diagnosticService: IDiagnosticService) {
		this.diagnosticService = diagnosticService;
	}

	getSystemStats: Handler = async (req, res) => {
		const data = await this.diagnosticService.getSystemStats();
		res.json({ success: true, msg: "OK", data });
	};
}

export default DiagnosticController;
