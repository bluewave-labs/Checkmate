const SERVICE_NAME = "inviteModule";

class InviteModule {
	constructor({ InviteToken, crypto, stringService }) {
		this.InviteToken = InviteToken;
		this.crypto = crypto;
		this.stringService = stringService;
	}

	requestInviteToken = async (userData) => {
		try {
			await this.InviteToken.deleteMany({ email: userData.email });
			userData.token = this.crypto.randomBytes(32).toString("hex");
			let inviteToken = new this.InviteToken(userData);
			await inviteToken.save();
			return inviteToken;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "requestInviteToken";
			throw error;
		}
	};

	getInviteToken = async (token) => {
		try {
			const invite = await this.InviteToken.findOne({
				token,
			});
			if (invite === null) {
				throw new Error(this.stringService.authInviteNotFound);
			}
			return invite;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getInviteToken";
			throw error;
		}
	};
	getInviteTokenAndDelete = async (token) => {
		try {
			const invite = await this.InviteToken.findOneAndDelete({
				token,
			});
			if (invite === null) {
				throw new Error(this.stringService.authInviteNotFound);
			}
			return invite;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getInviteTokenAndDelete";
			throw error;
		}
	};
}

export default InviteModule;
