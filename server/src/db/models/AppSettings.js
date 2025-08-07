import mongoose from "mongoose";
import notificationConfig from "../../utils/notificationConfig.js";

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
			default: notificationConfig.BACKOFF_ENABLED_DEFAULT,
		},
		initialBackoffDelay: {
			type: Number,
			default: notificationConfig.INITIAL_BACKOFF_DELAY_MS,
		},
		maxBackoffDelay: {
			type: Number,
			default: notificationConfig.MAX_BACKOFF_DELAY_MS,
		},
		backoffMultiplier: {
			type: Number,
			default: notificationConfig.BACKOFF_MULTIPLIER,
		},
		backoffJitterFactor: {
			type: Number,
			default: notificationConfig.JITTER_FACTOR,
		},
		globalThresholds: {
			cpu: { type: Number },
			memory: { type: Number },
			disk: { type: Number },
			temperature: { type: Number },
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("AppSettings", AppSettingsSchema);
