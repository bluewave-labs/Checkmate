import mongoose from "mongoose";

const StatusPageSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			immutable: true,
			required: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		type: {
			type: String,
			required: true,
			default: "uptime",
			enum: ["uptime"],
		},
		companyName: {
			type: String,
			required: true,
			default: "",
		},
		url: {
			type: String,
			unique: true,
			required: true,
			default: "",
		},
		timezone: {
			type: String,
			required: false,
		},
		color: {
			type: String,
			required: false,
			default: "#4169E1",
		},
		monitors: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Monitor",
				required: true,
			},
		],
		subMonitors: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Monitor",
				required: true,
			},
		],
		logo: {
			data: Buffer,
			contentType: String,
		},
		isPublished: {
			type: Boolean,
			default: false,
		},
		showCharts: {
			type: Boolean,
			default: true,
		},
		showUptimePercentage: {
			type: Boolean,
			default: true,
		},
		showAdminLoginLink: {
			type: Boolean,
			default: false,
		},
		customCSS: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

export default mongoose.model("StatusPage", StatusPageSchema);
