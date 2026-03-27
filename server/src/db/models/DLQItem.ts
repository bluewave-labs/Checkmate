import { Schema, model, type Types } from "mongoose";
import { DLQItemTypes, DLQItemStatuses, type DLQItem } from "@/types/dlqItem.js";

export interface DLQItemDocument extends Omit<DLQItem, "id" | "monitorId" | "teamId" | "nextRetryAt" | "createdAt" | "updatedAt"> {
	_id: Types.ObjectId;
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	nextRetryAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const DLQItemSchema = new Schema<DLQItemDocument>(
	{
		type: {
			type: String,
			enum: DLQItemTypes,
			required: true,
		},
		status: {
			type: String,
			enum: DLQItemStatuses,
			default: "pending",
		},
		payload: {
			type: Schema.Types.Mixed,
			required: true,
		},
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
		retryCount: {
			type: Number,
			default: 0,
		},
		maxRetries: {
			type: Number,
			default: 5,
		},
		lastError: {
			type: String,
			default: "",
		},
		nextRetryAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true }
);

DLQItemSchema.index({ status: 1, nextRetryAt: 1 });
DLQItemSchema.index({ teamId: 1, status: 1 });
DLQItemSchema.index({ createdAt: 1 });

const DLQItemModel = model<DLQItemDocument>("DLQItem", DLQItemSchema);

export { DLQItemModel };
export default DLQItemModel;
