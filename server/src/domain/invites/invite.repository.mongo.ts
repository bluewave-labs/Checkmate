import { IInvitesRepository } from "@/domain/invites/invite.repository.interface.js";
import type { Invite } from "@/domain/invites/invite.type.js";
import { type InviteDocument, InviteModel } from "@/domain/invites/invite.model.js";
import { DEFAULT_INVITE_EXPIRY_HOURS, HOUR_IN_MS } from "@/domain/invites/invite.constants.js";
import { AppError } from "@/utils/AppError.js";
import crypto from "crypto";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";

class MongoInvitesRepository implements IInvitesRepository {
	private toEntity = (doc: InviteDocument): Invite => {
		return {
			id: toStringId(doc._id),
			email: doc.email,
			teamId: toStringId(doc.teamId),
			role: doc.role ?? [],
			token: doc.token,
			expiry: toDateString(doc.expiry),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (invite: Partial<Invite>) => {
		await InviteModel.deleteMany({ email: invite.email });
		invite.token = crypto.randomBytes(32).toString("hex");
		invite.expiry = new Date(Date.now() + DEFAULT_INVITE_EXPIRY_HOURS * HOUR_IN_MS).toISOString();
		const inviteToken = await InviteModel.create(invite);
		return this.toEntity(inviteToken);
	};

	findByToken = async (token: string) => {
		const invite = await InviteModel.findOne({
			token,
		});
		if (invite === null) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(invite);
	};

	findByTokenAndDelete = async (token: string) => {
		const invite = await InviteModel.findOneAndDelete({
			token,
		});
		if (invite === null) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(invite);
	};

	findById = async ({ id, teamId }: { id: string; teamId: string }) => {
		const invite = await InviteModel.findOne({ _id: id, teamId });
		if (invite === null) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(invite);
	};

	findByTeamId = async (teamId: string) => {
		const invites = await InviteModel.find({ teamId }).sort({ createdAt: -1 });
		return invites.map(this.toEntity);
	};

	updateExpiryById = async ({ id, teamId, expiry }: { id: string; teamId: string; expiry: Date }) => {
		const invite = await InviteModel.findOneAndUpdate({ _id: id, teamId }, { expiry }, { new: true });
		if (invite === null) {
			throw new AppError({ message: "Invite not found", status: 404 });
		}
		return this.toEntity(invite);
	};
}
export default MongoInvitesRepository;
