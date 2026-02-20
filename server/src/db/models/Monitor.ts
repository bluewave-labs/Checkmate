import { Schema, model, Types, type UpdateQuery } from "mongoose";
import type { Monitor, MonitorMatchMethod, CheckSnapshot } from "@/types/monitor.js";
import { MonitorTypes, MonitorStatuses } from "@/types/monitor.js";

type CheckSnapshotDocument = Omit<CheckSnapshot, "createdAt"> & { createdAt: Date };

type MonitorDocumentBase = Omit<
	Monitor,
	"id" | "userId" | "teamId" | "notifications" | "selectedDisks" | "statusWindow" | "recentChecks" | "createdAt" | "updatedAt"
> & {
	statusWindow: boolean[];
	recentChecks: CheckSnapshotDocument[];
	notifications: Types.ObjectId[];
	selectedDisks: string[];
	matchMethod?: MonitorMatchMethod;
};

interface MonitorDocument extends MonitorDocumentBase {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const checkSnapshotSchema = new Schema<CheckSnapshotDocument>(
	{
		id: { type: String, required: true },
		status: { type: Boolean, required: true },
		createdAt: { type: Date, required: true },
	},
	{ _id: false, strict: false }
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
			type: String,
			enum: MonitorStatuses,
			default: "initializing",
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
		useAdvancedMatching: {
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
		cpuAlertThreshold: {
			type: Number,
			default: 100,
		},
		cpuAlertCounter: {
			type: Number,
			default: 5,
		},
		memoryAlertThreshold: {
			type: Number,
			default: 100,
		},
		memoryAlertCounter: {
			type: Number,
			default: 5,
		},
		diskAlertThreshold: {
			type: Number,
			default: 100,
		},
		diskAlertCounter: {
			type: Number,
			default: 5,
		},
		tempAlertThreshold: {
			type: Number,
			default: 100,
		},
		tempAlertCounter: {
			type: Number,
			default: 5,
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
		recentChecks: {
			type: [checkSnapshotSchema],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

MonitorSchema.index({ teamId: 1, type: 1 });

const MonitorModel = model<MonitorDocument>("Monitor", MonitorSchema);

export type { MonitorDocument, CheckSnapshotDocument };
export { MonitorModel };
export default MonitorModel;
