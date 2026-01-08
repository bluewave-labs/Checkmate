import mongoose, { Schema, Types } from "mongoose";
import {
  type ChannelType,
  ChannelTypes,
  NotificationChannelConfig,
} from "@/types/domain/index.js";
export interface INotificationChannel {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  type: ChannelType;
  config: NotificationChannelConfig;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationChannelConfigSchema = new Schema<NotificationChannelConfig>(
  {
    url: { type: String, required: false },
    emailAddress: { type: String, required: false },
  },
  { _id: false, strict: "throw" }
);

const NotificationChannelSchema = new Schema<INotificationChannel>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ChannelTypes,
    },
    config: { type: NotificationChannelConfigSchema, required: true },
    isActive: { type: Boolean, required: true, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NotificationChannelSchema.index({ isActive: 1 });
NotificationChannelSchema.index({ type: 1 });
NotificationChannelSchema.index({ type: 1, isActive: 1 });

export const NotificationChannel = mongoose.model<INotificationChannel>(
  "NotificationChannel",
  NotificationChannelSchema
);
