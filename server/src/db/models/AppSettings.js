import mongoose from "mongoose";

const AppSettingsSchema = mongoose.Schema(
	{
		checkTTL: {
			type: Number,
			default: 30,
		},
		language: {
			type: String,
			default: "gb",
		},
		pagespeedApiKey: {
			type: String,
		},
		systemEmailHost: {
			type: String,
		},
		systemEmailPort: {
			type: Number,
		},
		systemEmailAddress: {
			type: String,
		},
		systemEmailPassword: {
			type: String,
		},
		systemEmailUser: {
			type: String,
		},
		systemEmailConnectionHost: {
			type: String,
			default: "localhost",
		},
		systemEmailTLSServername: {
			type: String,
		},
		systemEmailSecure: {
			type: Boolean,
			default: false,
		},
		systemEmailPool: {
			type: Boolean,
			default: false,
		},
		systemEmailIgnoreTLS: {
			type: Boolean,
			default: false,
		},
		systemEmailRequireTLS: {
			type: Boolean,
			default: false,
		},
		systemEmailRejectUnauthorized: {
			type: Boolean,
			default: true,
		},
		singleton: {
			type: Boolean,
			required: true,
			unique: true,
			default: true,
		},
		version: {
			type: Number,
			default: 1,
		},
		// Exponential backoff configuration
		backoffEnabled: {
			type: Boolean,
			default: false,
		},
		initialBackoffDelay: {
			type: Number,
			default: 60000, // 1 minute in ms
		},
		maxBackoffDelay: {
			type: Number,
			default: 3600000, // 1 hour in ms
		},
		backoffMultiplier: {
			type: Number,
			default: 2,
		},
		backoffJitterFactor: {
			type: Number,
			default: 0.2, // 20% randomness
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("AppSettings", AppSettingsSchema);
