import { Schema, model, type Types } from "mongoose";
import type { Settings, SettingsThresholds } from "@/types/settings.js";

interface AppSettingsDocument extends Omit<Settings, "id" | "createdAt" | "updatedAt"> {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const thresholdsSchema = new Schema<SettingsThresholds>(
	{
		cpu: { type: Number },
		memory: { type: Number },
		disk: { type: Number },
		temperature: { type: Number },
	},
	{ _id: false }
);

const AppSettingsSchema = new Schema<AppSettingsDocument>(
	{
		checkTTL: { type: Number, default: 30 },
		language: { type: String, default: "gb" },
		jwtSecret: { type: String },
		pagespeedApiKey: { type: String },
		systemEmailHost: { type: String },
		systemEmailPort: { type: Number },
		systemEmailAddress: { type: String },
		systemEmailPassword: { type: String },
		systemEmailUser: { type: String },
		systemEmailConnectionHost: { type: String, default: "localhost" },
		systemEmailTLSServername: { type: String },
		systemEmailSecure: { type: Boolean, default: false },
		systemEmailPool: { type: Boolean, default: false },
		systemEmailIgnoreTLS: { type: Boolean, default: false },
		systemEmailRequireTLS: { type: Boolean, default: false },
		systemEmailRejectUnauthorized: { type: Boolean, default: true },
		showURL: { type: Boolean, default: false },
		singleton: { type: Boolean, required: true, unique: true, default: true },
		version: { type: Number, default: 1 },
		globalThresholds: { type: thresholdsSchema },
	},
	{ timestamps: true }
);

const AppSettingsModel = model<AppSettingsDocument>("AppSettings", AppSettingsSchema);

export type { AppSettingsDocument };
export { AppSettingsModel };
export default AppSettingsModel;
