import { Schema, model, type Types } from "mongoose";
import type { SsoSession } from "@/domain/sso/sso-session.type.js";

interface SsoSessionDocument extends Omit<SsoSession, "id" | "userId"> {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const SsoSessionSchema = new Schema<SsoSessionDocument>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		tokenHash: { type: String, required: true, unique: true },
		issuedAt: { type: Number, required: true },
		absoluteExpiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL: Mongo deletes the doc once `absoluteExpiresAt` passes
		revokedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

const SsoSessionModel = model<SsoSessionDocument>("SsoSession", SsoSessionSchema);

export type { SsoSessionDocument };
export { SsoSessionModel };
export default SsoSessionModel;
