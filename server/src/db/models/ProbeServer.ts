import { Schema, model, Types } from "mongoose";
import type { ProbeServer } from "@/types/script.js";

type ProbeServerDocumentBase = Omit<ProbeServer, "id" | "teamId" | "createdAt" | "updatedAt" | "lastSeen"> & {
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
	lastSeen?: Date;
};

export interface ProbeServerDocument extends ProbeServerDocumentBase {
	_id: Types.ObjectId;
}

const ProbeServerSchema = new Schema<ProbeServerDocument>(
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
			maxLength: 128,
		},
		url: {
			type: String,
			required: true,
			trim: true,
		},
		probeSecret: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastSeen: {
			type: Date,
		},
	},
	{ timestamps: true }
);

ProbeServerSchema.index({ teamId: 1 });

const ProbeServerModel = model<ProbeServerDocument>("ProbeServer", ProbeServerSchema);

export { ProbeServerModel };
export default ProbeServerModel;
