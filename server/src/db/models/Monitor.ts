import { Schema, model, Types, type UpdateQuery } from "mongoose";
import type { Monitor, MonitorMatchMethod, MonitorThresholds } from "@/types/monitor.js";
import { MonitorTypes } from "@/types/monitor.js";
import Check from "./Check.js";
import MonitorStats from "./MonitorStats.js";
import StatusPage from "./StatusPage.js";

type MonitorDocumentBase = Omit<
	Monitor,
	"id" | "userId" | "teamId" | "notifications" | "selectedDisks" | "statusWindow" | "createdAt" | "updatedAt"
> & {
	statusWindow: boolean[];
	notifications: Types.ObjectId[];
	selectedDisks: string[];
	matchMethod?: MonitorMatchMethod;
	thresholds?: MonitorThresholds;
};

interface MonitorDocument extends MonitorDocumentBase {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const thresholdsSchema = new Schema<MonitorThresholds>(
	{
		usage_cpu: { type: Number },
		usage_memory: { type: Number },
		usage_disk: { type: Number },
		usage_temperature: { type: Number },
	},
	{ _id: false }
);

const MonitorSchema = new Schema<MonitorDocument>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			immutable: true,
			required: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
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
		statusWindow: {
			type: [Boolean],
			default: [],
		},
		statusWindowSize: {
			type: Number,
			default: 5,
		},
		statusWindowThreshold: {
			type: Number,
			default: 60,
		},
		type: {
			type: String,
			required: true,
			enum: MonitorTypes,
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
			type: Number,
			default: 60000,
		},
		uptimePercentage: {
			type: Number,
			default: undefined,
		},
		notifications: [
			{
				type: Schema.Types.ObjectId,
				ref: "Notification",
			},
		],
		secret: {
			type: String,
		},
		thresholds: {
			type: thresholdsSchema,
		},
		alertThreshold: {
			type: Number,
			default: 5,
		},
		cpuAlertThreshold: {
			type: Number,
			default: function () {
				return this.alertThreshold;
			},
		},
		memoryAlertThreshold: {
			type: Number,
			default: function () {
				return this.alertThreshold;
			},
		},
		diskAlertThreshold: {
			type: Number,
			default: function () {
				return this.alertThreshold;
			},
		},
		tempAlertThreshold: {
			type: Number,
			default: function () {
				return this.alertThreshold;
			},
		},
		selectedDisks: {
			type: [String],
			default: [],
		},
		gameId: {
			type: String,
		},
		group: {
			type: String,
			trim: true,
			maxLength: 50,
			default: null,
			set(value: string | null) {
				return value && value.trim() ? value.trim() : null;
			},
		},
	},
	{
		timestamps: true,
	}
);

MonitorSchema.pre("save", function (next) {
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

MonitorSchema.pre("findOneAndUpdate", function (next) {
	const update = this.getUpdate() as UpdateQuery<MonitorDocument> | null;
	if (update && !Array.isArray(update) && update.alertThreshold !== undefined) {
		update.cpuAlertThreshold = update.alertThreshold;
		update.memoryAlertThreshold = update.alertThreshold;
		update.diskAlertThreshold = update.alertThreshold;
		update.tempAlertThreshold = update.alertThreshold;
	}
	next();
});

MonitorSchema.index({ teamId: 1, type: 1 });

const MonitorModel = model<MonitorDocument>("Monitor", MonitorSchema);

export type { MonitorDocument };
export { MonitorModel };
export default MonitorModel;
