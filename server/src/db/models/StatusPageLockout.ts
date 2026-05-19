import { Schema, model, type Types } from "mongoose";

interface StatusPageLockoutDocument {
	_id: Types.ObjectId;
	statusPageId: Types.ObjectId;
	ipHash: string;
	attempts: number;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const StatusPageLockoutSchema = new Schema<StatusPageLockoutDocument>(
	{
		statusPageId: {
			type: Schema.Types.ObjectId,
			ref: "StatusPage",
			required: true,
		},
		ipHash: {
			type: String,
			required: true,
		},
		attempts: {
			type: Number,
			required: true,
			default: 0,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true }
);

StatusPageLockoutSchema.index({ statusPageId: 1, ipHash: 1 }, { unique: true });
StatusPageLockoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const StatusPageLockoutModel = model<StatusPageLockoutDocument>("StatusPageLockout", StatusPageLockoutSchema);

export type { StatusPageLockoutDocument };
export { StatusPageLockoutModel };
export default StatusPageLockoutModel;
