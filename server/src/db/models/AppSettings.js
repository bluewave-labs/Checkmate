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
		globalThresholds: {
			type: Map,
			of: new mongoose.Schema(
				{
					cpu: { type: Number, min: 1, max: 100 },
					memory: { type: Number, min: 1, max: 100 },
					disk: { type: Number, min: 1, max: 100 },
					temperature: { type: Number, min: 1, max: 150 },
				},
				{ _id: false }
			),
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("AppSettings", AppSettingsSchema);
