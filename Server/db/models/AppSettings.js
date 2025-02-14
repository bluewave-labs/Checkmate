import mongoose from "mongoose";

const AppSettingsSchema = mongoose.Schema(
	{
		apiBaseUrl: {
			type: String,
			required: true,
			default: "http://localhost:5000/api/v1",
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
		refreshTokenSecret: {
			type: String,
			required: true,
			default: "my_refresh_secret",
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
		redisHost: {
			type: String,
			required: true,
			default: "127.0.0.1",
		},
		redisPort: {
			type: Number,
			default: "6379",
		},
		redisUser: {
			type: String,
		},
		redisPassword: {
			type: String,
		},
		redisDb: {
			type: Number,
			default: 0
		},
		redisPrefix: {
			type: String,
			default: "",
		},
		jwtTTL: {
			type: String,
			required: true,
			default: "2h",
		},
		refreshTokenTTL: {
			type: String,
			required: true,
			default: "7d",
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
