import { Schema, model, type Types } from "mongoose";
import { EgressStatuses, type EgressProbeResult, type EgressState } from "@/domain/egress/egress.type.js";

interface EgressStateDocument extends Omit<EgressState, "id" | "degradedSince" | "lastRecoveredAt" | "lastProbeAt" | "createdAt" | "updatedAt"> {
	_id: Types.ObjectId;
	singleton: boolean;
	degradedSince: Date | null;
	lastRecoveredAt: Date | null;
	lastProbeAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const probeResultSchema = new Schema<EgressProbeResult>(
	{
		target: { type: String, required: true },
		reachable: { type: Boolean, required: true },
		responseTime: { type: Number, default: 0 },
		message: { type: String },
	},
	{ _id: false }
);

const EgressStateSchema = new Schema<EgressStateDocument>(
	{
		singleton: { type: Boolean, required: true, unique: true, default: true },
		status: { type: String, enum: EgressStatuses, required: true, default: "ok" },
		degradedSince: { type: Date, default: null },
		lastRecoveredAt: { type: Date, default: null },
		lastProbeAt: { type: Date, default: null },
		lastProbeResults: { type: [probeResultSchema], default: () => [] },
	},
	{ timestamps: true }
);

const EgressStateModel = model<EgressStateDocument>("EgressState", EgressStateSchema);

export type { EgressStateDocument };
export { EgressStateModel };
export default EgressStateModel;
