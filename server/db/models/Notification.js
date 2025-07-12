import mongoose from "mongoose";
import notificationConfig from "../../utils/notificationConfig.js";

const NotificationSchema = mongoose.Schema(
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
			enum: ["email", "slack", "discord", "webhook", "pager_duty"],
		},
		notificationName: {
			type: String,
			required: true,
		},
		address: {
			type: String,
		},
		phone: {
			type: String,
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
		currentBackoffDelay: {
			type: Number,
			default: null,
		},
		lastNotificationTime: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

NotificationSchema.pre("save", function (next) {
	if (!this.cpuAlertThreshold || this.isModified("alertThreshold")) {
		this.cpuAlertThreshold = this.alertThreshold;
	}
	if (!this.memoryAlertThreshold || this.isModified("alertThreshold")) {
		this.memoryAlertThreshold = this.alertThreshold;
	}
	if (!this.diskAlertThreshold || this.isModified("alertThreshold")) {
		this.diskAlertThreshold = this.alertThreshold;
	}
	if (!this.tempAlertThreshold || this.isModified("alertThreshold")) {
		this.tempAlertThreshold = this.alertThreshold;
	}
	next();
});

NotificationSchema.pre("findOneAndUpdate", function (next) {
	const update = this.getUpdate();
	if (update.alertThreshold) {
		update.cpuAlertThreshold = update.alertThreshold;
		update.memoryAlertThreshold = update.alertThreshold;
		update.diskAlertThreshold = update.alertThreshold;
		update.tempAlertThreshold = update.alertThreshold;
	}
	next();
});

export default mongoose.model("Notification", NotificationSchema);
