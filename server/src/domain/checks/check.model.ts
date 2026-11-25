import { Schema, model, Types } from "mongoose";
import { MonitorTypes, type MonitorType } from "@/domain/monitors/monitor.type.js";
import { EgressStatuses } from "@/domain/egress/egress.type.js";
import type {
	Check,
	CheckAudits,
	CheckCaptureInfo,
	CheckCpuInfo,
	CheckDiskInfo,
	CheckErrorInfo,
	CheckHostInfo,
	CheckMemoryInfo,
	CheckMetadata,
	CheckNetworkInterfaceInfo,
	CheckRaidInfo,
	CheckRaidMemberInfo,
	CheckTimings,
	ILighthouseAudit,
} from "@/domain/checks/check.type.js";
import {
	DockerContainerInfo,
	DockerContainerMount,
	DockerContainerPort,
	DockerContainerStates,
	DockerContainerSummary,
	DockerHealthStatuses,
	DockerPortProtocols,
} from "@/domain/docker/docker.type.js";

type CheckMetadataDocument = Omit<CheckMetadata, "monitorId" | "teamId"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	type: MonitorType;
};

type CheckDocumentBase = Omit<Check, "id" | "metadata" | "createdAt" | "updatedAt"> & {
	metadata: CheckMetadataDocument;
	createdAt: Date;
	updatedAt: Date;
};

interface CheckDocument extends CheckDocumentBase {
	_id: Types.ObjectId;
}

const timingPhasesSchema = new Schema<CheckTimings["phases"]>(
	{
		wait: { type: Number, default: 0 },
		dns: { type: Number, default: 0 },
		tcp: { type: Number, default: 0 },
		tls: { type: Number, default: 0 },
		request: { type: Number, default: 0 },
		firstByte: { type: Number, default: 0 },
		download: { type: Number, default: 0 },
		total: { type: Number, default: 0 },
	},
	{ _id: false }
);

const timingsSchema = new Schema<CheckTimings>(
	{
		start: { type: Number, default: 0 },
		socket: { type: Number, default: 0 },
		lookup: { type: Number, default: 0 },
		connect: { type: Number, default: 0 },
		secureConnect: { type: Number, default: 0 },
		upload: { type: Number, default: 0 },
		response: { type: Number, default: 0 },
		end: { type: Number, default: 0 },
		phases: {
			type: timingPhasesSchema,
			default: () => ({}),
		},
	},
	{ _id: false }
);

const cpuSchema = new Schema<CheckCpuInfo>(
	{
		physical_core: { type: Number },
		logical_core: { type: Number },
		frequency: { type: Number },
		current_frequency: { type: Number },
		temperature: { type: [Number], default: undefined },
		free_percent: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const memorySchema = new Schema<CheckMemoryInfo>(
	{
		total_bytes: { type: Number },
		available_bytes: { type: Number },
		used_bytes: { type: Number },
		usage_percent: { type: Number },
	},
	{ _id: false }
);

const diskSchema = new Schema<CheckDiskInfo>(
	{
		device: { type: String, default: "" },
		mountpoint: { type: String, default: "" },
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

const hostSchema = new Schema<CheckHostInfo>(
	{
		os: { type: String },
		platform: { type: String },
		kernel_version: { type: String },
		pretty_name: { type: String },
	},
	{ _id: false }
);

const errorSchema = new Schema<CheckErrorInfo>(
	{
		metric: { type: [String], default: [] },
		err: { type: String, default: "" },
	},
	{ _id: false }
);

const captureSchema = new Schema<CheckCaptureInfo>(
	{
		version: { type: String, default: "" },
		mode: { type: String, default: "" },
	},
	{ _id: false }
);

const networkInterfaceSchema = new Schema<CheckNetworkInterfaceInfo>(
	{
		name: { type: String, default: "" },
		bytes_sent: { type: Number, default: 0 },
		bytes_recv: { type: Number, default: 0 },
		packets_sent: { type: Number, default: 0 },
		packets_recv: { type: Number, default: 0 },
		err_in: { type: Number, default: 0 },
		err_out: { type: Number, default: 0 },
		drop_in: { type: Number, default: 0 },
		drop_out: { type: Number, default: 0 },
		fifo_in: { type: Number, default: 0 },
		fifo_out: { type: Number, default: 0 },
	},
	{ _id: false }
);

const raidMemberSchema = new Schema<CheckRaidMemberInfo>(
	{
		device: { type: String, default: "" },
		state: { type: String, default: "" },
	},
	{ _id: false }
);

const raidSchema = new Schema<CheckRaidInfo>(
	{
		device: { type: String, default: "" },
		level: { type: String, default: "" },
		state: { type: String, default: "" },
		raid_disks: { type: Number, default: null },
		degraded_disks: { type: Number, default: null },
		sync_action: { type: String, default: null },
		sync_progress: { type: Number, default: null },
		members: { type: [raidMemberSchema], default: () => [] },
	},
	{ _id: false }
);

const lighthouseAuditSchema = new Schema<ILighthouseAudit>(
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

const auditsSchema = new Schema<CheckAudits>(
	{
		cls: { type: lighthouseAuditSchema, default: undefined },
		si: { type: lighthouseAuditSchema, default: undefined },
		fcp: { type: lighthouseAuditSchema, default: undefined },
		lcp: { type: lighthouseAuditSchema, default: undefined },
		tbt: { type: lighthouseAuditSchema, default: undefined },
	},
	{ _id: false }
);

const dockerContainerPortSchema = new Schema<DockerContainerPort>(
	{
		privatePort: { type: Number, required: true },
		protocol: { type: String, enum: DockerPortProtocols, default: "tcp" },
		publicPort: { type: Number },
		hostIp: { type: String },
	},
	{ _id: false }
);

const dockerContainerMountSchema = new Schema<DockerContainerMount>(
	{
		type: { type: String, default: "" },
		name: { type: String },
		source: { type: String, default: "" },
		destination: { type: String, default: "" },
		mode: { type: String, default: "" },
		rw: { type: Boolean, default: true },
	},
	{ _id: false }
);

const dockerContainerSchema = new Schema<DockerContainerInfo>(
	{
		id: { type: String, required: true },
		name: { type: String, default: "" },
		image: { type: String, default: "" },
		state: { type: String, enum: DockerContainerStates, default: "created" },
		status: { type: String, default: "" },
		health: { type: String, enum: DockerHealthStatuses, default: "none" },
		cpuPct: { type: Number },
		memoryUsedBytes: { type: Number },
		memoryLimitBytes: { type: Number },
		memoryPct: { type: Number },
		restartCount: { type: Number },
		startedAt: { type: String },
		ports: { type: [dockerContainerPortSchema], default: undefined },
		mounts: { type: [dockerContainerMountSchema], default: undefined },
		exitCode: { type: Number, default: undefined },
	},
	{ _id: false }
);

const containerSummarySchema = new Schema<DockerContainerSummary>(
	{
		total: { type: Number, default: 0 },
		running: { type: Number, default: 0 },
		stopped: { type: Number, default: 0 },
		unhealthy: { type: Number, default: 0 },
	},
	{ _id: false }
);

const metadataSchema = new Schema<CheckMetadataDocument>(
	{
		monitorId: {
			type: Schema.Types.ObjectId,
			ref: "Monitor",
			required: true,
			immutable: true,
			index: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			required: true,
			immutable: true,
			index: true,
		},
		type: {
			type: String,
			enum: MonitorTypes,
			required: true,
			index: true,
		},
	},
	{ _id: false }
);

const CheckSchema = new Schema<CheckDocument>(
	{
		metadata: {
			type: metadataSchema,
			required: true,
		},
		status: {
			type: Boolean,
			index: true,
		},
		responseTime: {
			type: Number,
		},
		timings: {
			type: timingsSchema,
			default: undefined,
		},
		statusCode: {
			type: Number,
			index: true,
		},
		message: {
			type: String,
		},

		cpu: {
			type: cpuSchema,
			default: undefined,
		},
		memory: {
			type: memorySchema,
			default: undefined,
		},
		disk: {
			type: [diskSchema],
			default: undefined,
		},
		host: {
			type: hostSchema,
			default: undefined,
		},
		errors: {
			type: [errorSchema],
			suppressReservedKeysWarning: true,
			default: undefined,
		},
		capture: {
			type: captureSchema,
			default: undefined,
		},
		net: {
			type: [networkInterfaceSchema],
			default: undefined,
		},
		raid: {
			type: [raidSchema],
			default: undefined,
		},
		accessibility: {
			type: Number,
		},
		bestPractices: {
			type: Number,
		},
		seo: {
			type: Number,
		},
		performance: {
			type: Number,
		},
		audits: {
			type: auditsSchema,
			default: undefined,
		},
		containers: {
			type: [dockerContainerSchema],
			default: undefined,
		},
		containerSummary: {
			type: containerSummarySchema,
			default: undefined,
		},
		egressStatus: {
			type: String,
			enum: EgressStatuses,
			default: undefined,
		},
	},
	{
		timestamps: true,
		strict: false,
		suppressReservedKeysWarning: true,
		timeseries: {
			timeField: "createdAt",
			metaField: "metadata",
			granularity: "seconds",
		},
	}
);

CheckSchema.index({ "metadata.monitorId": 1, createdAt: -1 });
CheckSchema.index({ "metadata.monitorId": 1, createdAt: 1 });
CheckSchema.index({ createdAt: 1 });
CheckSchema.index({ "metadata.teamId": 1, createdAt: -1 });
CheckSchema.index({ "metadata.monitorId": 1, "metadata.type": 1, createdAt: -1 });
CheckSchema.index({ "metadata.teamId": 1, status: 1, createdAt: -1 });

const CheckModel = model<CheckDocument>("Check", CheckSchema);

export type { CheckDocument, CheckMetadataDocument };
export { CheckModel, containerSummarySchema };
export default CheckModel;
