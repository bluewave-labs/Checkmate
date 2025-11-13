import mongoose, { Schema, Document, Types } from "mongoose";
export const MaintenanceRepeats = ["no repeat", "daily", "weekly"] as const;
export type MaintenanceRepeat = (typeof MaintenanceRepeats)[number];
export interface IMaintenance extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  isActive: boolean;
  repeat: MaintenanceRepeat;
  monitors: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    repeat: {
      type: String,
      enum: MaintenanceRepeats,
      required: false,
      default: null,
    },
    monitors: [
      {
        type: Schema.Types.ObjectId,
        ref: "Monitor",
        required: true,
      },
    ],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MaintenanceSchema.index({ isActive: 1 });
MaintenanceSchema.index({ startTime: 1 });
MaintenanceSchema.index({ endTime: 1 });

export const Maintenance = mongoose.model<IMaintenance>(
  "Maintenance",
  MaintenanceSchema
);
