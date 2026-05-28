import { Schema, model, Types } from "mongoose";
import type { AuditLogEntry } from "@/types/script.js";
import { ScriptAuditActions, SCRIPT_AUDIT_RETENTION_SECONDS } from "@/types/script.js";
import { CaptureAgentAuditActions } from "@/types/captureAgent.js";

// AuditLog is an append-only collection used to satisfy ISO 27001 A.8.15
// (logging) for the script monitor feature. Retention is enforced by a
// MongoDB TTL index on createdAt so records expire after 90 days.

const AuditActions = [...ScriptAuditActions, ...CaptureAgentAuditActions] as const;

type AuditLogDocumentBase = Omit<AuditLogEntry, "id" | "teamId" | "userId" | "createdAt" | "action"> & {
	action: (typeof AuditActions)[number];
	teamId: Types.ObjectId;
	userId: Types.ObjectId;
	createdAt: Date;
};

export interface AuditLogDocument extends AuditLogDocumentBase {
	_id: Types.ObjectId;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			required: true,
			immutable: true,
			index: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			immutable: true,
		},
		action: {
			type: String,
			required: true,
			enum: AuditActions,
			immutable: true,
		},
		resourceType: {
			type: String,
			required: true,
			immutable: true,
		},
		resourceId: {
			type: String,
			required: true,
			immutable: true,
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: {},
			immutable: true,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ teamId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: SCRIPT_AUDIT_RETENTION_SECONDS });

const AuditLogModel = model<AuditLogDocument>("AuditLog", AuditLogSchema);

export { AuditLogModel };
export default AuditLogModel;
