import InviteToken from "../../models/InviteToken.js";
import crypto from "crypto";
import ServiceRegistry from "../../../service/system/serviceRegistry.js";
import StringService from "../../../service/system/stringService.js";

const SERVICE_NAME = "inviteModule";
/**
 * Request an invite token for a user.
 *
 * This function deletes any existing invite tokens for the user's email,
 * generates a new token, saves it, and then returns the new token.
 *
 * @param {Object} userData - The user data.
 * @param {string} userData.email - The user's email.
 * @param {mongoose.Schema.Types.ObjectId} userData.teamId - The ID of the team.
 * @param {Array} userData.role - The user's role(s).
 * @param {Date} [userData.expiry=Date.now] - The expiry date of the token. Defaults to the current date and time.
 * @returns {Promise<InviteToken>} The invite token.
 * @throws {Error} If there is an error.
 */
const requestInviteToken = async (userData) => {
	try {
		await InviteToken.deleteMany({ email: userData.email });
		userData.token = crypto.randomBytes(32).toString("hex");
		let inviteToken = new InviteToken(userData);
		await inviteToken.save();
		return inviteToken;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "requestInviteToken";
		throw error;
	}
};

/**
 * Retrieves an invite token
 *
 * This function searches for an invite token in the database and deletes it.
 * If the invite token is not found, it throws an error.
 *
 * @param {string} token - The invite token to search for.
 * @returns {Promise<InviteToken>} The invite token data.
 * @throws {Error} If the invite token is not found or there is another error.
 */
const getInviteToken = async (token) => {
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
	try {
		const invite = await InviteToken.findOne({
			token,
		});
		if (invite === null) {
			throw new Error(stringService.authInviteNotFound);
		}
		return invite;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getInviteToken";
		throw error;
	}
};

/**
 * Retrieves and deletes an invite token
 *
 * This function searches for an invite token in the database and deletes it.
 * If the invite token is not found, it throws an error.
 *
 * @param {string} token - The invite token to search for.
 * @returns {Promise<InviteToken>} The invite token data.
 * @throws {Error} If the invite token is not found or there is another error.
 */
const getInviteTokenAndDelete = async (token) => {
	const stringService = ServiceRegistry.get(StringService.SERVICE_NAME);
	try {
		const invite = await InviteToken.findOneAndDelete({
			token,
		});
		if (invite === null) {
			throw new Error(stringService.authInviteNotFound);
		}
		return invite;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getInviteTokenAndDelete";
		throw error;
	}
};

export { requestInviteToken, getInviteToken, getInviteTokenAndDelete };
