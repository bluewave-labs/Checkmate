import { Schema, model, type Types } from "mongoose";
import { CONNECT_STATE_COLLECTION, type ConnectEnrollment, type ConnectState } from "@/domain/connect/connect.type.js";
import {
	type ConnectBackupKind,
	ConnectBackupKinds,
	type ConnectBackupResult,
	type ConnectOperation,
	ConnectOperations,
	type ConnectProgress,
	ConnectProgressStages,
	ConnectSchedule,
	ConnectScheduleIntervalHours,
	ConnectVerifyOutcomes,
	type ConnectVerifyResult,
} from "@/domain/connect/connect-backup.type.js";

interface ConnectOperationDocument {
	type: ConnectOperation;
	kind: ConnectBackupKind | null;
	backupId: string | null;
	recoveryKey: string | null;
	replaceExisting: boolean;
	requestedAt: Date;
	startedAt: Date | null;
}

interface ConnectStateDocument extends Omit<ConnectState, "operation"> {
	_id: Types.ObjectId;
	singleton: boolean;
	operation: ConnectOperationDocument | null;
	createdAt: Date;
	updatedAt: Date;
}

const enrollmentSchema = new Schema<ConnectEnrollment>(
	{
		connectUrl: { type: String, required: true },
		agentId: { type: String, required: true },
		token: { type: String, required: true },
		apiUrl: { type: String, default: null },
	},
	{ _id: false }
);

const operationSchema = new Schema<ConnectOperationDocument>(
	{
		type: { type: String, enum: ConnectOperations, required: true },
		kind: { type: String, enum: ConnectBackupKinds, default: null },
		backupId: { type: String, default: null },
		recoveryKey: { type: String, default: null },
		replaceExisting: { type: Boolean, default: false },
		requestedAt: { type: Date, required: true },
		startedAt: { type: Date, default: null },
	},
	{ _id: false }
);

const progressSchema = new Schema<ConnectProgress>(
	{
		operation: { type: String, enum: ConnectOperations, required: true },
		stage: { type: String, enum: ConnectProgressStages, required: true },
		percent: { type: Number, default: null },
		bytes: { type: Number, default: null },
		attempt: { type: Number, default: null },
		attempts: { type: Number, default: null },
	},
	{ _id: false }
);

const backupResultSchema = new Schema<ConnectBackupResult>(
	{
		ok: { type: Boolean, required: true },
		at: { type: Date, required: true },
		kind: { type: String, enum: ConnectBackupKinds, default: null },
		sizeBytes: { type: Number, default: null },
		sha256: { type: String, default: null },
		backupId: { type: String, default: null },
		durationMs: { type: Number, default: null },
		error: { type: String, default: null },
	},
	{ _id: false }
);

const verifyResultSchema = new Schema<ConnectVerifyResult>(
	{
		outcome: { type: String, enum: ConnectVerifyOutcomes, required: true },
		at: { type: Date, required: true },
		error: { type: String, default: null },
	},
	{ _id: false }
);

const scheduleSchema = new Schema<ConnectSchedule>(
	{
		enabled: { type: Boolean, required: true },
		intervalHours: { type: Number, enum: ConnectScheduleIntervalHours, required: true },
		kind: { type: String, enum: ConnectBackupKinds, required: true },
	},
	{ _id: false }
);

const ConnectStateSchema = new Schema<ConnectStateDocument>(
	{
		singleton: { type: Boolean, required: true, unique: true, default: true },
		enrollment: { type: enrollmentSchema, default: null },
		remoteAccessEnabled: { type: Boolean, default: false },
		recoveryKey: { type: String, default: null },
		operation: { type: operationSchema, default: null },
		progress: { type: progressSchema, default: null },
		lastBackup: { type: backupResultSchema, default: null },
		lastRestore: { type: backupResultSchema, default: null },
		lastVerify: { type: verifyResultSchema, default: null },
		schedule: { type: scheduleSchema, default: null },
	},
	{ timestamps: true, collection: CONNECT_STATE_COLLECTION }
);

const ConnectStateModel = model<ConnectStateDocument>("ConnectState", ConnectStateSchema);

export type { ConnectStateDocument, ConnectOperationDocument };
export { ConnectStateModel };
export default ConnectStateModel;
