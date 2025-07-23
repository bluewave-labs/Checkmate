import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "diagnosticController";

const obs = new PerformanceObserver((items) => {
	const entry = items.getEntries()[0];
	performance.clearMarks();
});
obs.observe({ entryTypes: ["measure"] });
class DiagnosticController {
	constructor({ diagnosticService }) {
		this.diagnosticService = diagnosticService;
	}

	getSystemStats = asyncHandler(
		async (req, res, next) => {
			const diagnostics = await this.diagnosticService.getSystemStats();
			return res.success({
				msg: "OK",
				data: diagnostics,
			});
		},
		SERVICE_NAME,
		"getSystemStats"
	);
}
export default DiagnosticController;
