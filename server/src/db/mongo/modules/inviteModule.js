const SERVICE_NAME = "inviteModule";

class InviteModule {
	constructor({ Invite, crypto, stringService }) {
		this.Invite = Invite;
		this.crypto = crypto;
		this.stringService = stringService;
	}

	requestInviteToken = async (userData) => {
		try {
			await this.Invite.deleteMany({ email: userData.email });
			userData.token = this.crypto.randomBytes(32).toString("hex");
			let inviteToken = new this.Invite(userData);
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
			const invite = await this.Invite.findOne({
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
			const invite = await this.Invite.findOneAndDelete({
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
