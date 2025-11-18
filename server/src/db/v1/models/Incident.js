import mongoose from "mongoose";

const IncidentSchema = mongoose.Schema(
	{
		monitorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Monitor",
			required: true,
			immutable: true,
			index: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			required: true,
			immutable: true,
			index: true,
		},
		startTime: {
			type: Date,
			required: true,
			immutable: true,
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
			index: true,
			default: null,
		},
		resolutionType: {
			type: String,
			enum: ["automatic", "manual"],
			default: null,
		},
		resolvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		comment: {
			type: String,
			default: null,
		},
		checks: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Check",
			},
		],
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

const Incident = mongoose.model("Incident", IncidentSchema);

export default Incident;
