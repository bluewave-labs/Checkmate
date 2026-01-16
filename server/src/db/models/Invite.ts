import { Schema, model, type Types } from "mongoose";
import type { Invite } from "@/types/invite.js";

type InviteDocumentBase = Omit<Invite, "id" | "teamId" | "createdAt" | "updatedAt" | "expiry"> & {
	teamId: Types.ObjectId;
	expiry: Date;
};

interface InviteDocument extends InviteDocumentBase {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const InviteSchema = new Schema<InviteDocument>(
	{
		email: { type: String, required: true, unique: true },
		teamId: { type: Schema.Types.ObjectId, ref: "Team", immutable: true, required: true },
		role: { type: [String], required: true, default: ["user"] },
		token: { type: String, required: true },
		expiry: { type: Date, default: Date.now, expires: 3600 },
	},
	{ timestamps: true }
);

const InviteModel = model<InviteDocument>("Invite", InviteSchema);

export type { InviteDocument };
export { InviteModel };
export default InviteModel;
