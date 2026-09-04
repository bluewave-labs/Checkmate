import { Schema, model, Types } from "mongoose";
import type { Monitor, MonitorMatchMethod, CheckSnapshot } from "@/domain/monitors/monitor.type.js";
import { DnsRecordTypes, MonitorTypes, MonitorStatuses, PageSpeedStrategies, HttpMethods, ProxyModes } from "@/domain/monitors/monitor.type.js";
import type {
	CheckAudits,
	ILighthouseAudit,
	SnapshotCpuInfo,
	SnapshotDiskInfo,
	SnapshotHostInfo,
	SnapshotMemoryInfo,
} from "@/domain/checks/check.type.js";
import { containerSummarySchema } from "@/domain/checks/check.model.js";

type CheckSnapshotDocument = Omit<CheckSnapshot, "createdAt"> & { createdAt: Date };

type MonitorDocumentBase = Omit<
	Monitor,
	"id" | "userId" | "teamId" | "notifications" | "tags" | "selectedDisks" | "statusWindow" | "recentChecks" | "proxyId" | "createdAt" | "updatedAt"
> & {
	statusWindow: boolean[];
	recentChecks: CheckSnapshotDocument[];
	notifications: Types.ObjectId[];
	tags: Types.ObjectId[];
	selectedDisks: string[];
	matchMethod?: MonitorMatchMethod;
	proxyId?: Types.ObjectId;
};

interface MonitorDocument extends MonitorDocumentBase {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	lastEvaluatedAt: number; // epoch ms
}

const snapshotCpuSchema = new Schema<SnapshotCpuInfo>(
	{
		physical_core: { type: Number },
		logical_core: { type: Number },
		frequency: { type: Number },
		current_frequency: { type: Number },
		temperature: { type: [Number] },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const snapshotMemorySchema = new Schema<SnapshotMemoryInfo>(
	{
		total_bytes: { type: Number },
		used_bytes: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const snapshotDiskSchema = new Schema<SnapshotDiskInfo>(
	{
		device: { type: String },
		total_bytes: { type: Number },
		used_bytes: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const snapshotHostSchema = new Schema<SnapshotHostInfo>(
	{
		os: { type: String },
		platform: { type: String },
		pretty_name: { type: String },
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
		statusCode: { type: Number },
		message: { type: String },
		cpu: { type: snapshotCpuSchema },
		memory: { type: snapshotMemorySchema },
		disk: { type: [snapshotDiskSchema] },
		host: { type: snapshotHostSchema },
		accessibility: { type: Number },
		bestPractices: { type: Number },
		seo: { type: Number },
		performance: { type: Number },
		audits: { type: snapshotAuditsSchema },
		containerSummary: { type: containerSummarySchema },
		createdAt: { type: Date, required: true },
	},
	{ _id: false, suppressReservedKeysWarning: true }
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
		method: {
			type: String,
			enum: HttpMethods,
			default: "GET",
			required: true,
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
		proxyMode: {
			type: String,
			enum: ProxyModes,
			default: "inherit",
		},
		proxyId: {
			type: Schema.Types.ObjectId,
			ref: "Proxy",
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
		tags: [
			{
				type: Schema.Types.ObjectId,
				ref: "Tag",
			},
		],
		customUpCodes: {
			type: [Number],
			default: [],
		},
		secret: {
			type: String,
		},
		sshPrivateKey: {
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
		strategy: {
			type: String,
			enum: PageSpeedStrategies,
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
		dockerLogsEnabled: {
			type: Boolean,
			default: false,
		},
		dnsServer: {
			type: String,
		},
		dnsRecordType: {
			type: String,
			enum: DnsRecordTypes,
		},
		recentChecks: {
			type: [checkSnapshotSchema],
			default: [],
		},
		lastEvaluatedAt: {
			type: Number,
			default: 0,
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
