import mongoose from "mongoose";
import HardwareCheck from "./HardwareCheck.js";
import PageSpeedCheck from "./PageSpeedCheck.js";
import Check from "./Check.js";
import MonitorStats from "./MonitorStats.js";
import StatusPage from "./StatusPage.js";

const MonitorSchema = mongoose.Schema(
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
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
		},
		status: {
			type: Boolean,
			default: undefined,
		},
		type: {
			type: String,
			required: true,
			enum: ["http", "ping", "pagespeed", "hardware", "docker", "port"],
		},
		ignoreTlsErrors: {
			type: Boolean,
			default: false,
		},
		jsonPath: {
			type: String,
		},
		expectedValue: {
			type: String,
		},
		matchMethod: {
			type: String,
			enum: ["equal", "include", "regex", ""],
		},
		url: {
			type: String,
			required: true,
		},
		port: {
			type: Number,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		interval: {
			// in milliseconds
			type: Number,
			default: 60000,
		},
		uptimePercentage: {
			type: Number,
			default: undefined,
		},
		thresholds: {
			type: {
				usage_cpu: { type: Number },
				usage_memory: { type: Number },
				usage_disk: { type: Number },
				usage_temperature: { type: Number },
			},
			_id: false,
		},
		notifications: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Notification",
			},
		],
		secret: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

MonitorSchema.pre("findOneAndDelete", async function (next) {
	// Delete checks and stats
	try {
		const doc = await this.model.findOne(this.getFilter());

		if (doc.type === "pagespeed") {
			await PageSpeedCheck.deleteMany({ monitorId: doc._id });
		} else if (doc.type === "hardware") {
			await HardwareCheck.deleteMany({ monitorId: doc._id });
		} else {
			await Check.deleteMany({ monitorId: doc._id });
		}

		// Deal with status pages
		await StatusPage.updateMany({ monitors: doc._id }, { $pull: { monitors: doc._id } });

		await MonitorStats.deleteMany({ monitorId: doc._id.toString() });
		next();
	} catch (error) {
		next(error);
	}
});

MonitorSchema.pre("deleteMany", async function (next) {
	const filter = this.getFilter();
	const monitors = await this.model.find(filter).select(["_id", "type"]).lean();
	for (const monitor of monitors) {
		if (monitor.type === "pagespeed") {
			await PageSpeedCheck.deleteMany({ monitorId: monitor._id });
		} else if (monitor.type === "hardware") {
			await HardwareCheck.deleteMany({ monitorId: monitor._id });
		} else {
			await Check.deleteMany({ monitorId: monitor._id });
		}
		await MonitorStats.deleteMany({ monitorId: monitor._id.toString() });
	}
	next();
});

MonitorSchema.index({ teamId: 1, type: 1 });

export default mongoose.model("Monitor", MonitorSchema);
