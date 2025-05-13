import {
	inviteRoleValidation,
	inviteBodyValidation,
	inviteVerificationBodyValidation,
} from "../validation/joi.js";
import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { handleError, handleValidationError } from "./controllerUtils.js";
import { getTokenFromHeaders } from "../utils/utils.js";

const SERVICE_NAME = "inviteController";

class InviteController {
	constructor(db, settingsService, emailService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.stringService = stringService;
	}

	/**
	 * Issues an invitation to a new user. Only admins can invite new users. An invitation token is created and sent via email.
	 * @async
	 * @param {Object} req - The Express request object.
	 * @property {Object} req.headers - The headers of the request.
	 * @property {string} req.headers.authorization - The authorization header containing the JWT token.
	 * @property {Object} req.body - The body of the request.
	 * @property {string} req.body.email - The email of the user to be invited.
	 * @param {Object} res - The Express response object.
	 * @param {function} next - The next middleware function.
	 * @returns {Object} The response object with a success status, a message indicating the sending of the invitation, and the invitation token.
	 * @throws {Error} If there is an error during the process, especially if there is a validation error (422).
	 */
	getInviteToken = async (req, res, next) => {
		try {
			// Only admins can invite
			const token = getTokenFromHeaders(req.headers);
			const { role, teamId } = jwt.decode(token);
			req.body.teamId = teamId;
			try {
				await inviteRoleValidation.validateAsync({ roles: role });
				await inviteBodyValidation.validateAsync(req.body);
			} catch (error) {
				next(handleValidationError(error, SERVICE_NAME));
				return;
			}

			const inviteToken = await this.db.requestInviteToken({ ...req.body });
			return res.success({
				msg: this.stringService.inviteIssued,
				data: inviteToken,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "inviteController"));
		}
	};

	sendInviteEmail = async (req, res, next) => {
		try {
			// Only admins can invite
			const token = getTokenFromHeaders(req.headers);
			const { role, firstname, teamId } = jwt.decode(token);
			req.body.teamId = teamId;
			try {
				await inviteRoleValidation.validateAsync({ roles: role });
				await inviteBodyValidation.validateAsync(req.body);
			} catch (error) {
				next(handleValidationError(error, SERVICE_NAME));
				return;
			}

			const inviteToken = await this.db.requestInviteToken({ ...req.body });
			const { clientHost } = this.settingsService.getSettings();
			this.emailService
				.buildAndSendEmail(
					"employeeActivationTemplate",
					{
						name: firstname,
						link: `${clientHost}/register/${inviteToken.token}`,
					},
					req.body.email,
					"Welcome to Uptime Monitor"
				)
				.catch((error) => {
					logger.error({
						message: error.message,
						service: SERVICE_NAME,
						method: "issueInvitation",
						stack: error.stack,
					});
				});

			return res.success({
				msg: this.stringService.inviteIssued,
				data: inviteToken,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "inviteController"));
		}
	};

	inviteVerifyController = async (req, res, next) => {
		try {
			await inviteVerificationBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const invite = await this.db.getInviteToken(req.body.token);

			return res.success({
				msg: this.stringService.inviteVerified,
				data: invite,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "inviteVerifyController"));
		}
	};
}

export default InviteController;
