import mongoose from "mongoose";

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
			enum: ["email", "slack", "discord", "webhook", "pager_duty", "ntfy"],
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
		// ntfy-specific fields
		ntfyAuthMethod: {
			type: String,
			enum: ["none", "username_password", "bearer_token"],
			default: "none",
		},
		ntfyUsername: {
			type: String,
		},
		ntfyPassword: {
			type: String, // Will be encrypted
		},
		ntfyBearerToken: {
			type: String, // Will be encrypted
		},
		ntfyPriority: {
			type: Number,
			min: 1,
			max: 5,
			default: 3,
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
