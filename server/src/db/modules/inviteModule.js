import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "inviteModule";

class InviteModule {
	constructor({ InviteToken, crypto }) {
		this.InviteToken = InviteToken;
		this.crypto = crypto;
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
				throw new AppError({ message: "Invite token not found", status: 404 });
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
				throw new Error("Invite not found");
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
