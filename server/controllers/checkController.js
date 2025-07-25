import BaseController from "./baseController.js";
import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	deleteChecksParamValidation,
	deleteChecksByTeamIdParamValidation,
	updateChecksTTLBodyValidation,
	ackCheckBodyValidation,
	ackAllChecksParamValidation,
	ackAllChecksBodyValidation,
} from "../validation/joi.js";

const SERVICE_NAME = "checkController";

/**
 * Check Controller
 *
 * Handles all check-related HTTP requests including retrieving checks,
 * acknowledging checks, deleting checks, and managing check TTL settings.
 *
 * @class CheckController
 * @description Manages check operations and monitoring data
 */
class CheckController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of CheckController.
	 *
	 * @param {Object} commonDependencies - Common dependencies injected into the controller
	 * @param {Object} dependencies - The dependencies required by the controller
	 * @param {Object} dependencies.settingsService - Service for application settings
	 * @param {Object} dependencies.checkService - Check business logic service
	 */
	constructor(commonDependencies, { settingsService, checkService }) {
		super(commonDependencies);
		this.settingsService = settingsService;
		this.checkService = checkService;
	}

	get serviceName() {
		return CheckController.SERVICE_NAME;
	}

	/**
	 * Retrieves checks for a specific monitor with filtering and pagination.
	 *
	 * @async
	 * @function getChecksByMonitor
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.monitorId - ID of the monitor to get checks for
	 * @param {Object} req.query - Query parameters for filtering and pagination
	 * @param {string} [req.query.type] - Type of checks to filter by
	 * @param {string} [req.query.sortOrder] - Sort order (asc/desc)
	 * @param {string} [req.query.dateRange] - Date range filter
	 * @param {string} [req.query.filter] - General filter string
	 * @param {boolean} [req.query.ack] - Filter by acknowledgment status
	 * @param {number} [req.query.page] - Page number for pagination
	 * @param {number} [req.query.rowsPerPage] - Number of rows per page
	 * @param {string} [req.query.status] - Filter by check status
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with checks data
	 * @throws {Error} 422 - Validation error if parameters are invalid
	 * @throws {Error} 404 - Not found if monitor doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to monitor
	 * @example
	 * GET /checks/monitor/507f1f77bcf86cd799439011?page=1&rowsPerPage=10&status=down
	 * // Requires JWT authentication
	 */
	getChecksByMonitor = this.asyncHandler(
		async (req, res) => {
			await getChecksParamValidation.validateAsync(req.params);
			await getChecksQueryValidation.validateAsync(req.query);

			const result = await this.checkService.getChecksByMonitor({
				monitorId: req?.params?.monitorId,
				query: req?.query,
				teamId: req?.user?.teamId,
			});

			return res.success({
				msg: this.stringService.checkGet,
				data: result,
			});
		},
		SERVICE_NAME,
		"getChecksByMonitor"
	);

	/**
	 * Retrieves all checks for the current user's team with filtering and pagination.
	 *
	 * @async
	 * @function getChecksByTeam
	 * @param {Object} req - Express request object
	 * @param {Object} req.query - Query parameters for filtering and pagination
	 * @param {string} [req.query.sortOrder] - Sort order (asc/desc)
	 * @param {string} [req.query.dateRange] - Date range filter
	 * @param {string} [req.query.filter] - General filter string
	 * @param {boolean} [req.query.ack] - Filter by acknowledgment status
	 * @param {number} [req.query.page] - Page number for pagination
	 * @param {number} [req.query.rowsPerPage] - Number of rows per page
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with checks data
	 * @throws {Error} 422 - Validation error if query parameters are invalid
	 * @example
	 * GET /checks/team?page=1&rowsPerPage=20&status=down&ack=false
	 * // Requires JWT authentication
	 */
	getChecksByTeam = this.asyncHandler(
		async (req, res) => {
			await getTeamChecksQueryValidation.validateAsync(req.query);
			const checkData = await this.checkService.getChecksByTeam({
				teamId: req?.user?.teamId,
				query: req?.query,
			});
			return res.success({
				msg: this.stringService.checkGet,
				data: checkData,
			});
		},
		SERVICE_NAME,
		"getChecksByTeam"
	);

	/**
	 * Retrieves a summary of checks for the current user's team.
	 *
	 * @async
	 * @function getChecksSummaryByTeamId
	 * @param {Object} req - Express request object
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with checks summary
	 * @example
	 * GET /checks/summary
	 * // Requires JWT authentication
	 * // Response includes counts by status, time ranges, etc.
	 */
	getChecksSummaryByTeamId = this.asyncHandler(
		async (req, res) => {
			const summary = await this.checkService.getChecksSummaryByTeamId({ teamId: req?.user?.teamId });
			return res.success({
				msg: this.stringService.checkGetSummary,
				data: summary,
			});
		},
		SERVICE_NAME,
		"getChecksSummaryByTeamId"
	);

	/**
	 * Acknowledges a specific check by ID.
	 *
	 * @async
	 * @function ackCheck
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.checkId - ID of the check to acknowledge
	 * @param {Object} req.body - Request body containing acknowledgment data
	 * @param {boolean} req.body.ack - Acknowledgment status (true/false)
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with updated check data
	 * @throws {Error} 422 - Validation error if request body is invalid
	 * @throws {Error} 404 - Not found if check doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to check
	 * @example
	 * PUT /checks/507f1f77bcf86cd799439011/ack
	 * {
	 *   "ack": true
	 * }
	 * // Requires JWT authentication
	 */
	ackCheck = this.asyncHandler(
		async (req, res) => {
			await ackCheckBodyValidation.validateAsync(req.body);

			const updatedCheck = await this.checkService.ackCheck({
				checkId: req?.params?.checkId,
				teamId: req?.user?.teamId,
				ack: req?.body?.ack,
			});

			return res.success({
				msg: this.stringService.checkUpdateStatus,
				data: updatedCheck,
			});
		},
		SERVICE_NAME,
		"ackCheck"
	);

	/**
	 * Acknowledges all checks for a specific monitor or path.
	 *
	 * @async
	 * @function ackAllChecks
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.monitorId - ID of the monitor
	 * @param {string} req.params.path - Path for acknowledgment (e.g., "monitor")
	 * @param {Object} req.body - Request body containing acknowledgment data
	 * @param {boolean} req.body.ack - Acknowledgment status (true/false)
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with updated checks data
	 * @throws {Error} 422 - Validation error if parameters or body are invalid
	 * @throws {Error} 404 - Not found if monitor doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to monitor
	 * @example
	 * PUT /checks/monitor/507f1f77bcf86cd799439011/ack
	 * {
	 *   "ack": true
	 * }
	 * // Requires JWT authentication
	 */
	ackAllChecks = this.asyncHandler(
		async (req, res) => {
			await ackAllChecksParamValidation.validateAsync(req.params);
			await ackAllChecksBodyValidation.validateAsync(req.body);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("No team ID in request");
			}

			const updatedChecks = await this.checkService.ackAllChecks({
				monitorId: req?.params?.monitorId,
				path: req?.params?.path,
				teamId: req?.user?.teamId,
				ack: req?.body?.ack,
			});

			return res.success({
				msg: this.stringService.checkUpdateStatus,
				data: updatedChecks,
			});
		},
		SERVICE_NAME,
		"ackAllChecks"
	);

	/**
	 * Deletes all checks for a specific monitor.
	 *
	 * @async
	 * @function deleteChecks
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.monitorId - ID of the monitor whose checks to delete
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with deletion count
	 * @throws {Error} 422 - Validation error if monitorId is invalid
	 * @throws {Error} 404 - Not found if monitor doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to monitor
	 * @example
	 * DELETE /checks/monitor/507f1f77bcf86cd799439011
	 * // Requires JWT authentication
	 * // Response: { "data": { "deletedCount": 150 } }
	 */
	deleteChecks = this.asyncHandler(
		async (req, res) => {
			await deleteChecksParamValidation.validateAsync(req.params);

			const deletedCount = await this.checkService.deleteChecks({
				monitorId: req.params.monitorId,
				teamId: req?.user?.teamId,
			});

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		},
		SERVICE_NAME,
		"deleteChecks"
	);

	/**
	 * Deletes all checks for the current user's team.
	 *
	 * @async
	 * @function deleteChecksByTeamId
	 * @param {Object} req - Express request object
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with deletion count
	 * @throws {Error} 422 - Validation error if parameters are invalid
	 * @example
	 * DELETE /checks/team
	 * // Requires JWT authentication
	 * // Response: { "data": { "deletedCount": 1250 } }
	 */
	deleteChecksByTeamId = this.asyncHandler(
		async (req, res) => {
			await deleteChecksByTeamIdParamValidation.validateAsync(req.params);

			const deletedCount = await this.checkService.deleteChecksByTeamId({ teamId: req?.user?.teamId });

			return res.success({
				msg: this.stringService.checkDelete,
				data: { deletedCount },
			});
		},
		SERVICE_NAME,
		"deleteChecksByTeamId"
	);

	/**
	 * Updates the TTL (Time To Live) setting for checks in the current user's team.
	 *
	 * @async
	 * @function updateChecksTTL
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing TTL data
	 * @param {number} req.body.ttl - TTL value in days
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response confirming TTL update
	 * @throws {Error} 422 - Validation error if TTL value is invalid
	 * @example
	 * PUT /checks/ttl
	 * {
	 *   "ttl": 30
	 * }
	 * // Requires JWT authentication
	 * // Sets check TTL to 30 days
	 */
	updateChecksTTL = this.asyncHandler(
		async (req, res) => {
			await updateChecksTTLBodyValidation.validateAsync(req.body);

			await this.checkService.updateChecksTTL({
				teamId: req?.user?.teamId,
				ttl: req?.body?.ttl,
			});

			return res.success({
				msg: this.stringService.checkUpdateTTL,
			});
		},
		SERVICE_NAME,
		"updateChecksTtl"
	);
}

export default CheckController;
