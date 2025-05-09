import mongoose from "mongoose";

const AppSettingsSchema = mongoose.Schema(
	{
		language: {
			type: String,
			default: "gb",
		},
		pagespeedApiKey: {
			type: String,
			default: "",
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
		singleton: {
			type: Boolean,
			required: true,
			unique: true,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("AppSettings", AppSettingsSchema);
