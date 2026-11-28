import { Schema, model } from "mongoose";

interface SsoLoginStateDocument {
	state: string;
	returnOrigin: string;
	expiresAt: Date;
	usedAt: Date | null;
}

const SsoLoginStateSchema = new Schema<SsoLoginStateDocument>(
	{
		state: { type: String, required: true, unique: true },
		returnOrigin: { type: String, required: true },
		expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL: Mongo deletes the doc once `expiresAt` passes
		usedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

const SsoLoginStateModel = model<SsoLoginStateDocument>("SsoLoginState", SsoLoginStateSchema);

export type { SsoLoginStateDocument };
export { SsoLoginStateModel };
export default SsoLoginStateModel;
