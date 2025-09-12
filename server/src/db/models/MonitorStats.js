import mongoose from "mongoose";

const MonitorStatsSchema = new mongoose.Schema(
	{
		monitorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
			index: true,
		},
		avgResponseTime: {
			type: Number,
			default: 0,
		},
		totalChecks: {
			type: Number,
			default: 0,
		},
		totalUpChecks: {
			type: Number,
			default: 0,
		},
		totalDownChecks: {
			type: Number,
			default: 0,
		},
		uptimePercentage: {
			type: Number,
			default: 0,
		},
		lastCheckTimestamp: {
			type: Number,
			default: 0,
		},
		lastResponseTime: {
			type: Number,
			default: 0,
		},
		timeOfLastFailure: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const MonitorStats = mongoose.model("MonitorStats", MonitorStatsSchema);

export default MonitorStats;
