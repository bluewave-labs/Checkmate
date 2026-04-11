import { Schema, model, type Types } from "mongoose";
import { IncidentResolutionTypes, type Incident } from "@/types/incident.js";

type IncidentDocumentBase = Omit<Incident, "id" | "monitorId" | "teamId" | "resolvedBy" | "startTime" | "endTime" | "createdAt" | "updatedAt"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	resolvedBy?: Types.ObjectId | null;
	startTime: Date;
	endTime: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export interface IncidentDocument extends IncidentDocumentBase {
	_id: Types.ObjectId;
}

const IncidentSchema = new Schema<IncidentDocument>(
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
		startTime: {
			type: Date,
			immutable: true,
			required: true,
		},
		endTime: {
			type: Date,
			default: null,
		},
		status: {
			type: Boolean,
			default: true,
			index: true,
		},
		message: {
			type: String,
			default: null,
		},
		statusCode: {
			type: Number,
			default: null,
			index: true,
		},
		resolutionType: {
			type: String,
			enum: IncidentResolutionTypes,
			default: null,
		},
		resolvedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		resolvedByEmail: {
			type: String,
			default: null,
		},
		comment: {
			type: String,
			default: null,
		},
		severity: {
			type: String,
			enum: ["none", "high", "critical", null],
			default: "none",
		},
	},
	{ timestamps: true }
);

IncidentSchema.index({ monitorId: 1, status: 1 });
IncidentSchema.index({ teamId: 1, status: 1 });
IncidentSchema.index({ teamId: 1, startTime: -1 });
IncidentSchema.index({ status: 1, startTime: -1 });
IncidentSchema.index({ resolutionType: 1, status: 1 });
IncidentSchema.index({ resolvedBy: 1, status: 1 });
IncidentSchema.index({ createdAt: -1 });

const IncidentModel = model<IncidentDocument>("Incident", IncidentSchema);

export { IncidentModel };
export default IncidentModel;
