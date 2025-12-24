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
		},
		timezone: String,
		color: {
			type: String,
			default: "#4169E1",
		},

		monitorSelectionMode: {
			type: String,
			enum: ["manual", "cidr"],
			default: "manual",
		},

		cidrRanges: {
			type: [String],
			default: [],
		},

		monitors: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Monitor",
			},
		],

		subMonitors: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Monitor",
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
