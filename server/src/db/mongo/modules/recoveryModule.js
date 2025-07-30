const SERVICE_NAME = "recoveryModule";

class RecoveryModule {
	constructor({ User, RecoveryToken, crypto, stringService }) {
		this.User = User;
		this.RecoveryToken = RecoveryToken;
		this.crypto = crypto;
		this.stringService = stringService;
	}

	requestRecoveryToken = async (email) => {
		try {
			// Delete any existing tokens
			await this.RecoveryToken.deleteMany({ email });
			let recoveryToken = new this.RecoveryToken({
				email,
				token: this.crypto.randomBytes(32).toString("hex"),
			});
			await recoveryToken.save();
			return recoveryToken;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "requestRecoveryToken";
			throw error;
		}
	};
	validateRecoveryToken = async (candidateToken) => {
		try {
			const recoveryToken = await this.RecoveryToken.findOne({
				token: candidateToken,
			});
			if (recoveryToken !== null) {
				return recoveryToken;
			} else {
				throw new Error(this.stringService.dbTokenNotFound);
			}
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "validateRecoveryToken";
			throw error;
		}
	};

	resetPassword = async (password, candidateToken) => {
		try {
			const newPassword = password;

			// Validate token again
			const recoveryToken = await this.validateRecoveryToken(candidateToken);
			const user = await this.User.findOne({ email: recoveryToken.email });

			if (user === null) {
				console.log("WTF2");
				throw new Error(this.stringService.dbUserNotFound);
			}

			const match = await user.comparePassword(newPassword);

			if (match === true) {
				console.log("WTF");
				throw new Error("Password cannot be the same as the old password");
			}

			user.password = newPassword;
			await user.save();
			await this.RecoveryToken.deleteMany({ email: recoveryToken.email });
			// Fetch the user again without the password
			const userWithoutPassword = await this.User.findOne({
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
}

export default RecoveryModule;
