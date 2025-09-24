import crypto from "node:crypto";
import { ITokenizedUser, IInvite, Invite } from "../../../db/v2/models/index.js";
import ApiError from "../../../utils/ApiError.js";

export interface IInviteService {
	create: (tokenizedUser: ITokenizedUser, invite: IInvite) => Promise<{ token: string }>;
	getAll: () => Promise<IInvite[]>;
	get: (tokenHash: string) => Promise<IInvite>;
	delete: (id: string) => Promise<boolean>;
}

class InviteService implements IInviteService {
	constructor() {}

	create = async (tokenizedUser: ITokenizedUser, inviteData: IInvite) => {
		const token = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
		try {
			const invite = await Invite.create({
				...inviteData,
				tokenHash,
				createdBy: tokenizedUser.sub,
				updatedBy: tokenizedUser.sub,
			});
			if (!invite) {
				throw new ApiError("Failed to create invite", 500);
			}
			return { token };
		} catch (error: any) {
			if (error?.code === 11000) {
				const dupError = new ApiError("Invite with this email already exists", 409);
				dupError.stack = error?.stack;
				throw dupError;
			}
			throw error;
		}
	};

	get = async (token: string) => {
		const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
		const invite = await Invite.findOne({ tokenHash });
		if (!invite) {
			throw new ApiError("Invite not found", 404);
		}
		return invite;
	};

	getAll = async () => {
		return Invite.find();
	};

	delete = async (id: string) => {
		const result = await Invite.deleteOne({ _id: id });
		if (!result.deletedCount) {
			throw new ApiError("Invite not found", 404);
		}
		return result.deletedCount === 1;
	};
}

export default InviteService;
