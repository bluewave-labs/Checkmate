import { Schema, model, Types } from "mongoose";
import type { Monitor, MonitorMatchMethod, CheckSnapshot } from "@/types/monitor.js";
import { MonitorTypes, MonitorStatuses } from "@/types/monitor.js";
import type {
	CheckAudits,
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckNetworkInterfaceInfo,
	GotTimings,
	ILighthouseAudit,
} from "@/types/check.js";

type CheckSnapshotDocument = Omit<CheckSnapshot, "createdAt"> & { createdAt: Date };

type MonitorDocumentBase = Omit<
	Monitor,
	"id" | "userId" | "teamId" | "notifications" | "escalationNotifications" | "selectedDisks" | "statusWindow" | "recentChecks" | "statusChangedAt" | "createdAt" | "updatedAt"
> & {
	statusWindow: boolean[];
	statusChangedAt?: Date;
	recentChecks: CheckSnapshotDocument[];
	notifications: Types.ObjectId[];
	escalationNotifications?: Types.ObjectId[];
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

const snapshotTimingPhasesSchema = new Schema<GotTimings["phases"]>(
	{
		wait: { type: Number },
		dns: { type: Number },
		tcp: { type: Number },
		tls: { type: Number },
		request: { type: Number },
		firstByte: { type: Number },
		download: { type: Number },
		total: { type: Number },
	},
	{ _id: false }
);

const snapshotTimingsSchema = new Schema<GotTimings>(
	{
		start: { type: Number },
		socket: { type: Number },
		lookup: { type: Number },
		connect: { type: Number },
		secureConnect: { type: Number },
		upload: { type: Number },
		response: { type: Number },
		end: { type: Number },
		phases: { type: snapshotTimingPhasesSchema },
	},
	{ _id: false }
);

const snapshotCpuSchema = new Schema<CheckCpuInfo>(
	{
		physical_core: { type: Number },
		logical_core: { type: Number },
		frequency: { type: Number },
		current_frequency: { type: Number },
		temperature: { type: [Number] },
		free_percent: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const snapshotMemorySchema = new Schema<CheckMemoryInfo>(
	{
		total_bytes: { type: Number },
		available_bytes: { type: Number },
		used_bytes: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const snapshotDiskSchema = new Schema<CheckDiskInfo>(
	{
		device: { type: String },
		mountpoint: { type: String },
		total_bytes: { type: Number },
		free_bytes: { type: Number },
		used_bytes: { type: Number },
		usage_percent: { type: Number },
		total_inodes: { type: Number },
		free_inodes: { type: Number },
		used_inodes: { type: Number },
		inodes_usage_percent: { type: Number },
		read_bytes: { type: Number },
		write_bytes: { type: Number },
		read_time: { type: Number },
		write_time: { type: Number },
	},
	{ _id: false }
);

const snapshotHostSchema = new Schema<CheckHostInfo>(
	{
		os: { type: String },
		platform: { type: String },
		kernel_version: { type: String },
		pretty_name: { type: String },
	},
	{ _id: false }
);

const snapshotErrorSchema = new Schema<CheckErrorInfo>(
	{
		metric: { type: [String] },
		err: { type: String },
	},
	{ _id: false }
);

const snapshotCaptureSchema = new Schema<CheckCaptureInfo>(
	{
		version: { type: String },
		mode: { type: String },
	},
	{ _id: false }
);

const snapshotNetworkInterfaceSchema = new Schema<CheckNetworkInterfaceInfo>(
	{
		name: { type: String },
		bytes_sent: { type: Number },
		bytes_recv: { type: Number },
		packets_sent: { type: Number },
		packets_recv: { type: Number },
		err_in: { type: Number },
		err_out: { type: Number },
		drop_in: { type: Number },
		drop_out: { type: Number },
		fifo_in: { type: Number },
		fifo_out: { type: Number },
	},
	{ _id: false }
);

const snapshotLighthouseAuditSchema = new Schema<ILighthouseAudit>(
	{
		id: { type: String },
		title: { type: String },
		score: { type: Number },
		displayValue: { type: String },
		numericValue: { type: Number },
		numericUnit: { type: String },
	},
	{ _id: false }
);

const snapshotAuditsSchema = new Schema<CheckAudits>(
	{
		cls: { type: snapshotLighthouseAuditSchema },
		si: { type: snapshotLighthouseAuditSchema },
		fcp: { type: snapshotLighthouseAuditSchema },
		lcp: { type: snapshotLighthouseAuditSchema },
		tbt: { type: snapshotLighthouseAuditSchema },
	},
	{ _id: false }
);

const checkSnapshotSchema = new Schema<CheckSnapshotDocument>(
	{
		id: { type: String, required: true },
		status: { type: Boolean, required: true },
		responseTime: { type: Number },
		timings: { type: snapshotTimingsSchema },
		statusCode: { type: Number },
		message: { type: String },
		cpu: { type: snapshotCpuSchema },
		memory: { type: snapshotMemorySchema },
		disk: { type: [snapshotDiskSchema] },
		host: { type: snapshotHostSchema },
		errors: { type: [snapshotErrorSchema] },
		capture: { type: snapshotCaptureSchema },
		net: { type: [snapshotNetworkInterfaceSchema] },
		accessibility: { type: Number },
		bestPractices: { type: Number },
		seo: { type: Number },
		performance: { type: Number },
		audits: { type: snapshotAuditsSchema },
		createdAt: { type: Date, required: true },
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
			type: String,
			enum: MonitorStatuses,
			default: "initializing",
		},
		statusChangedAt: {
			type: Date,
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
		grpcServiceName: {
			type: String,
			default: "",
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
		geoCheckEnabled: {
			type: Boolean,
			default: false,
		},
		geoCheckLocations: {
			type: [String],
			default: [],
		},
		geoCheckInterval: {
			type: Number,
			default: 300000,
		},
		escalateAfterMinutes: {
			type: Number,
		},
		escalationNotifications: [
			{
				type: Schema.Types.ObjectId,
				ref: "Notification",
			},
		],
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
