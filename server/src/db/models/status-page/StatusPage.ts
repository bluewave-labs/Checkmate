import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStatusPage {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  description?: string;
  url: string;
  isPublished: boolean;
  monitors: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StatusPageSchema = new Schema<IStatusPage>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true },
    url: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, required: true, default: false },
    monitors: [{ type: Schema.Types.ObjectId, ref: "Monitor", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

StatusPageSchema.index({ isPublished: 1 });

export const StatusPage = mongoose.model<IStatusPage>(
  "StatusPage",
  StatusPageSchema
);
