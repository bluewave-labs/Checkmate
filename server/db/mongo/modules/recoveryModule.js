import UserModel from "../../models/User.js";
import RecoveryToken from "../../models/RecoveryToken.js";
import crypto from "crypto";
import serviceRegistry from "../../../service/system/serviceRegistry.js";
import StringService from "../../../service/system/stringService.js";

const SERVICE_NAME = "recoveryModule";

/**
 * Request a recovery token
 * @async
 * @param {string} email
 * @returns {Promise<UserModel>}
 * @throws {Error}
 */
const requestRecoveryToken = async (email) => {
	try {
		// Delete any existing tokens
		await RecoveryToken.deleteMany({ email });
		let recoveryToken = new RecoveryToken({
			email,
			token: crypto.randomBytes(32).toString("hex"),
		});
		await recoveryToken.save();
		return recoveryToken;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "requestRecoveryToken";
		throw error;
	}
};

const validateRecoveryToken = async (candidateToken) => {
	const stringService = serviceRegistry.get(StringService.SERVICE_NAME);
	try {
		const recoveryToken = await RecoveryToken.findOne({
			token: candidateToken,
		});
		if (recoveryToken !== null) {
			return recoveryToken;
		} else {
			throw new Error(stringService.dbTokenNotFound);
		}
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "validateRecoveryToken";
		throw error;
	}
};

const resetPassword = async (password, candidateToken) => {
	const stringService = serviceRegistry.get(StringService.SERVICE_NAME);
	try {
		const newPassword = password;

		// Validate token again
		const recoveryToken = await validateRecoveryToken(candidateToken);
		const user = await UserModel.findOne({ email: recoveryToken.email });

		if (user === null) {
			throw new Error(stringService.dbUserNotFound);
		}

		const match = await user.comparePassword(newPassword);
		if (match === true) {
			throw new Error(stringService.dbResetPasswordBadMatch);
		}

		user.password = newPassword;
		await user.save();
		await RecoveryToken.deleteMany({ email: recoveryToken.email });
		// Fetch the user again without the password
		const userWithoutPassword = await UserModel.findOne({
			email: recoveryToken.email,
		})
			.select("-password")
			.select("-profileImage");
		return userWithoutPassword;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "resetPassword";
		throw error;
	}
};

export { requestRecoveryToken, validateRecoveryToken, resetPassword };
