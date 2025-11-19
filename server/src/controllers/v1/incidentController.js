import BaseController from "./baseController.js";

const SERVICE_NAME = "incidentController";

/**
 * Incident Controller
 *
 * Handles all incident-related HTTP requests including retrieving incidents,
 * resolving incidents manually, and getting incident summaries.
 *
 * @class IncidentController
 * @description Manages incident operations and tracking
 */
class IncidentController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;

	/**
	 * Creates an instance of IncidentController.
	 *
	 * @param {Object} commonDependencies - Common dependencies injected into the controller
	 * @param {Object} dependencies - The dependencies required by the controller
	 * @param {Object} dependencies.incidentService - Incident business logic service
	 */
	constructor(commonDependencies, { incidentService }) {
		super(commonDependencies);
		this.incidentService = incidentService;
	}

	get serviceName() {
		return IncidentController.SERVICE_NAME;
	}

	/**
	 * Retrieves all incidents for the current user's team with filtering and pagination.
	 *
	 * @async
	 * @function getIncidentsByTeam
	 * @param {Object} req - Express request object
	 * @param {Object} req.query - Query parameters for filtering and pagination
	 * @param {string} [req.query.sortOrder] - Sort order (asc/desc)
	 * @param {string} [req.query.dateRange] - Date range filter
	 * @param {string} [req.query.filter] - General filter string
	 * @param {number} [req.query.page] - Page number for pagination
	 * @param {number} [req.query.rowsPerPage] - Number of rows per page
	 * @param {boolean} [req.query.status] - Filter by incident status (true=active, false=resolved)
	 * @param {string} [req.query.monitorId] - Filter by monitor ID
	 * @param {string} [req.query.resolutionType] - Filter by resolution type (automatic/manual)
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with incidents data
	 * @throws {Error} 422 - Validation error if query parameters are invalid
	 * @example
	 * GET /incidents/team?page=1&rowsPerPage=20&status=true&filter=active
	 * // Requires JWT authentication
	 */
	getIncidentsByTeam = this.asyncHandler(
		async (req, res) => {
			const result = await this.incidentService.getIncidentsByTeam({
				teamId: req?.user?.teamId,
				query: req?.query,
			});

			return res.success({
				msg: "Incidents retrieved successfully",
				data: result,
			});
		},
		SERVICE_NAME,
		"getIncidentsByTeam"
	);

	/**
	 * Retrieves a summary of incidents for the current user's team.
	 *
	 * @async
	 * @function getIncidentSummary
	 * @param {Object} req - Express request object
	 * @param {Object} req.query - Query parameters
	 * @param {string} [req.query.dateRange] - Date range filter
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with incidents summary
	 * @example
	 * GET /incidents/summary?dateRange=week
	 * // Requires JWT authentication
	 */
	getIncidentSummary = this.asyncHandler(
		async (req, res) => {
			const summary = await this.incidentService.getIncidentSummary({
				teamId: req?.user?.teamId,
				query: req?.query,
			});

			return res.success({
				msg: "Incident summary retrieved successfully",
				data: summary,
			});
		},
		SERVICE_NAME,
		"getIncidentSummary"
	);

	/**
	 * Retrieves a specific incident by ID.
	 *
	 * @async
	 * @function getIncidentById
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.incidentId - ID of the incident to retrieve
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with incident data
	 * @throws {Error} 404 - Not found if incident doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to incident
	 * @example
	 * GET /incidents/507f1f77bcf86cd799439011
	 * // Requires JWT authentication
	 */
	getIncidentById = this.asyncHandler(
		async (req, res) => {
			const incident = await this.incidentService.getIncidentById({
				incidentId: req?.params?.incidentId,
				teamId: req?.user?.teamId,
			});

			return res.success({
				msg: "Incident retrieved successfully",
				data: incident,
			});
		},
		SERVICE_NAME,
		"getIncidentById"
	);

	/**
	 * Manually resolves a specific incident by ID.
	 *
	 * @async
	 * @function resolveIncidentManually
	 * @param {Object} req - Express request object
	 * @param {Object} req.params - URL parameters
	 * @param {string} req.params.incidentId - ID of the incident to resolve
	 * @param {Object} req.body - Request body containing resolution data
	 * @param {string} [req.body.comment] - Optional comment about the resolution
	 * @param {Object} req.user - Current authenticated user (from JWT)
	 * @param {string} req.user.teamId - User's team ID
	 * @param {string} req.user._id - User's ID
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Success response with updated incident data
	 * @throws {Error} 422 - Validation error if request body is invalid
	 * @throws {Error} 404 - Not found if incident doesn't exist
	 * @throws {Error} 403 - Forbidden if user doesn't have access to incident
	 * @throws {Error} 400 - Bad request if incident is already resolved
	 * @example
	 * PUT /incidents/507f1f77bcf86cd799439011/resolve
	 * {
	 *   "comment": "Issue resolved by restarting the service"
	 * }
	 * // Requires JWT authentication
	 */
	resolveIncidentManually = this.asyncHandler(
		async (req, res) => {
			const resolvedIncident = await this.incidentService.resolveIncidentManually({
				incidentId: req?.params?.incidentId,
				userId: req?.user?._id,
				teamId: req?.user?.teamId,
				comment: req?.body?.comment,
			});

			return res.success({
				msg: "Incident resolved successfully",
				data: resolvedIncident,
			});
		},
		SERVICE_NAME,
		"resolveIncidentManually"
	);
}

export default IncidentController;
