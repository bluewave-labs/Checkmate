import { inviteBodyValidation, inviteVerificationBodyValidation } from "../validation/joi.js";
import BaseController from "./baseController.js";
const SERVICE_NAME = "inviteController";

/**
 * Controller for handling user invitation operations
 * Manages invite token generation, email sending, and token verification
 */
class InviteController extends BaseController {
	/**
	 * Creates a new InviteController instance
	 * @param {Object} commonDependencies - Common dependencies injected into the controller
	 * @param {Object} dependencies.inviteService - Service for invite-related operations
	 */
	constructor(commonDependencies, { inviteService }) {
		super(commonDependencies);
		this.inviteService = inviteService;
	}

	/**
	 * Generates an invite token for a user invitation
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing invite details
	 * @param {Object} req.user - Authenticated user object
	 * @param {string} req.user.teamId - Team ID of the authenticated user
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Response with invite token data
	 */
	getInviteToken = this.asyncHandler(
		async (req, res) => {
			const invite = req.body;
			const teamId = req?.user?.teamId;
			invite.teamId = teamId;
			await inviteBodyValidation.validateAsync(invite);
			const inviteToken = await this.inviteService.getInviteToken({ invite, teamId });
			return res.success({
				msg: this.stringService.inviteIssued,
				data: inviteToken,
			});
		},
		SERVICE_NAME,
		"getInviteToken"
	);

	/**
	 * Sends an invitation email to a user
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing invite details
	 * @param {Object} req.user - Authenticated user object
	 * @param {string} req.user.teamId - Team ID of the authenticated user
	 * @param {string} req.user.firstName - First name of the authenticated user
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Response with invite token data
	 */
	sendInviteEmail = this.asyncHandler(
		async (req, res) => {
			const inviteRequest = req.body;
			inviteRequest.teamId = req?.user?.teamId;
			await inviteBodyValidation.validateAsync(inviteRequest);

			const inviteToken = await this.inviteService.sendInviteEmail({
				inviteRequest,
				firstName: req?.user?.firstName,
			});
			return res.success({
				msg: this.stringService.inviteIssued,
				data: inviteToken,
			});
		},
		SERVICE_NAME,
		"sendInviteEmail"
	);

	/**
	 * Verifies an invite token and returns invite details
	 * @param {Object} req - Express request object
	 * @param {Object} req.body - Request body containing the invite token
	 * @param {string} req.body.token - The invite token to verify
	 * @param {Object} res - Express response object
	 * @returns {Promise<Object>} Response with verified invite data
	 */
	verifyInviteToken = this.asyncHandler(
		async (req, res) => {
			await inviteVerificationBodyValidation.validateAsync(req.body);
			const invite = await this.inviteService.verifyInviteToken({ inviteToken: req?.body?.token });
			return res.success({
				msg: this.stringService.inviteVerified,
				data: invite,
			});
		},
		SERVICE_NAME,
		"verifyInviteToken"
	);
}

export default InviteController;
