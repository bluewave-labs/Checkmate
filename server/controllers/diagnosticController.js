const SERVICE_NAME = "diagnosticController";
import BaseController from "./baseController.js";
/**
 * Diagnostic Controller
 *
 * Handles system diagnostic and monitoring requests including system statistics,
 * performance metrics, and health checks.
 *
 * @class DiagnosticController
 * @description Manages system diagnostics and performance monitoring
 */
class DiagnosticController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of DiagnosticController.
	 * @param {Object} commonDependencies - Common dependencies injected into the controller
	 * @param {Object} dependencies - The dependencies required by the controller
	 * @param {Object} dependencies.diagnosticService - Service for system diagnostics and monitoring
	 */
	constructor(commonDependencies, { diagnosticService }) {
		super(commonDependencies);
		this.diagnosticService = diagnosticService;
	}

	get serviceName() {
		return DiagnosticController.SERVICE_NAME;
	}
	/**
	 * Retrieves comprehensive system statistics and performance metrics.
	 *
	 * @async
	 * @function getSystemStats
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with system diagnostics data
	 * @description Returns system performance metrics, memory usage, CPU statistics,
	 * and other diagnostic information useful for monitoring system health.
	 * @example
	 * GET /diagnostics/stats
	 * // Response includes:
	 * // - Memory usage (heap, external, arrayBuffers)
	 * // - CPU usage statistics
	 * // - System uptime
	 * // - Performance metrics
	 * // - Database connection status
	 * // - Active processes/connections
	 */
	getSystemStats = this.asyncHandler(
		async (req, res) => {
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
