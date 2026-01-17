import { Schema, model, type Types } from "mongoose";
import type { RecoveryToken as RecoveryTokenEntity } from "@/types/recoveryToken.js";

type RecoveryTokenDocumentBase = Omit<RecoveryTokenEntity, "id" | "createdAt" | "updatedAt" | "expiry"> & {
	expiry: Date;
};

interface RecoveryTokenDocument extends RecoveryTokenDocumentBase {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const RecoveryTokenSchema = new Schema<RecoveryTokenDocument>(
	{
		email: { type: String, required: true, unique: true },
		token: { type: String, required: true },
		expiry: { type: Date, default: Date.now, expires: 600 },
	},
	{ timestamps: true }
);

const RecoveryTokenModel = model<RecoveryTokenDocument>("RecoveryToken", RecoveryTokenSchema);

export type { RecoveryTokenDocument };
export { RecoveryTokenModel };
export default RecoveryTokenModel;
