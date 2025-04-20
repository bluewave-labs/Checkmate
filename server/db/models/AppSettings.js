import mongoose from "mongoose";

const AppSettingsSchema = mongoose.Schema(
	{
		apiBaseUrl: {
			type: String,
			required: true,
			default: "http://localhost:5000/api/v1",
		},
		language: {
			type: String,
			default: "en",
		},
		logLevel: {
			type: String,
			default: "debug",
			enum: ["debug", "none", "error", "warn"],
		},
		clientHost: {
			type: String,
			required: true,
			default: "http://localhost:5173",
		},
		jwtSecret: {
			type: String,
			required: true,
			default: "my_secret",
		},
		dbType: {
			type: String,
			required: true,
			default: "MongoDB",
		},
		dbConnectionString: {
			type: String,
			required: true,
			default: "mongodb://localhost:27017/uptime_db",
		},
		redisUrl: {
			type: String,
			default: "redis://127.0.0.1:6379",
		},
		jwtTTL: {
			type: String,
			required: true,
			default: "2h",
		},
		pagespeedApiKey: {
			type: String,
			default: "",
		},
		systemEmailHost: {
			type: String,
			default: "smtp.gmail.com",
		},
		systemEmailPort: {
			type: Number,
			default: 465,
		},
		systemEmailAddress: {
			type: String,
			default: "",
		},
		systemEmailPassword: {
			type: String,
			default: "",
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