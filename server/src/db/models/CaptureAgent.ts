import { Schema, model, Types } from "mongoose";
import type { CaptureAgent } from "@/types/captureAgent.js";

// CaptureAgent stores the registration record for an external collector.
// `secret` is the bcrypt hash used to authenticate inbound requests that
// originate from the agent. `agentTokenCipher` is the AES-256-GCM
// ciphertext of the plain bearer token Checkmate sends back out when it
// dispatches work to the agent. Both fields are required to keep an agent
// usable, but tests sometimes operate without `agentTokenCipher`, hence
// optional.

type CaptureAgentDocumentBase = Omit<CaptureAgent, "id" | "teamId" | "createdAt" | "updatedAt" | "lastSeen"> & {
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	lastSeen?: Date;
};

export interface CaptureAgentDocument extends CaptureAgentDocumentBase {
	_id: Types.ObjectId;
}

const CaptureAgentSchema = new Schema<CaptureAgentDocument>(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			required: true,
			immutable: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxLength: 120,
		},
		url: {
			type: String,
			required: true,
			trim: true,
		},
		secret: {
			type: String,
			required: true,
		},
		agentTokenCipher: {
			type: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		canCollectMetrics: {
			type: Boolean,
			default: true,
		},
		canExecuteScripts: {
			type: Boolean,
			default: false,
		},
		lastSeen: {
			type: Date,
		},
		tags: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

CaptureAgentSchema.index({ teamId: 1, name: 1 }, { unique: true });

const CaptureAgentModel = model<CaptureAgentDocument>("CaptureAgent", CaptureAgentSchema);

export { CaptureAgentModel };
export default CaptureAgentModel;
