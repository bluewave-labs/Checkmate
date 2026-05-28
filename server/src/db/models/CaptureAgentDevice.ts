import { Schema, model, Types } from "mongoose";
import type { CaptureAgentDevice } from "@/types/captureAgent.js";
import { DeviceOSTypes, DeviceAuthTypes } from "@/types/captureAgent.js";

// CaptureAgentDevice represents an SSH/WinRM endpoint that a Capture agent
// targets when executing scripts. Credentials (when present) are stored
// encrypted via the same AES-256-GCM helper used for script bodies, so
// `encryptedPassword` is ciphertext, not plaintext.

type CaptureAgentDeviceDocumentBase = Omit<CaptureAgentDevice, "id" | "captureAgentId" | "teamId" | "createdAt" | "updatedAt"> & {
	captureAgentId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};

export interface CaptureAgentDeviceDocument extends CaptureAgentDeviceDocumentBase {
	_id: Types.ObjectId;
}

const CaptureAgentDeviceSchema = new Schema<CaptureAgentDeviceDocument>(
	{
		captureAgentId: {
			type: Schema.Types.ObjectId,
			ref: "CaptureAgent",
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
		name: {
			type: String,
			required: true,
			trim: true,
			maxLength: 120,
		},
		hostname: {
			type: String,
			required: true,
			trim: true,
		},
		ipAddress: {
			type: String,
			trim: true,
		},
		os: {
			type: String,
			enum: DeviceOSTypes,
			default: "unknown",
		},
		authType: {
			type: String,
			enum: DeviceAuthTypes,
			default: "none",
		},
		username: {
			type: String,
		},
		encryptedPassword: {
			type: String,
		},
		sshKeyFingerprint: {
			type: String,
		},
		port: {
			type: Number,
			min: 1,
			max: 65535,
		},
		tags: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

CaptureAgentDeviceSchema.index({ captureAgentId: 1, name: 1 }, { unique: true });

const CaptureAgentDeviceModel = model<CaptureAgentDeviceDocument>("CaptureAgentDevice", CaptureAgentDeviceSchema);

export { CaptureAgentDeviceModel };
export default CaptureAgentDeviceModel;
