import mongoose, { Schema, Document, Types } from "mongoose";

export const ResolutionTypes = ["auto", "manual"] as const;
export type ResolutionType = (typeof ResolutionTypes)[number];

export interface IIncident {
  _id: Types.ObjectId;
  monitorId: Types.ObjectId;
  teamId: Types.ObjectId;
  startedAt: Date;
  startCheck: Types.ObjectId;
  endedAt?: Date;
  endCheck?: Types.ObjectId;
  resolved: boolean;
  resolvedBy?: Types.ObjectId;
  resolutionType?: ResolutionType;
  resolutionNote?: string;
}

const IncidentSchema = new Schema<IIncident>(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    startedAt: { type: Date, required: true },
    startCheck: { type: Schema.Types.ObjectId, ref: "Check", required: true },
    endedAt: { type: Date },
    endCheck: { type: Schema.Types.ObjectId, ref: "Check" },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolutionType: {
      type: String,
      enum: ResolutionTypes,
    },
    resolutionNote: { type: String },
  },
  { timestamps: true }
);

export const Incident = mongoose.model<IIncident>("Incident", IncidentSchema);
