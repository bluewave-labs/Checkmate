import mongoose, { Schema, Document, Types } from "mongoose";
import { Check, MonitorStats } from "@/db/models/index.js";

export const MonitorTypes = [
  "http",
  "https",
  "ping",
  "infrastructure",
  "pagespeed",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const MonitorStatuses = [
  "up",
  "down",
  "paused",
  "initializing",
] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];
export interface IMonitor extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  url: string;
  secret?: string;
  type: MonitorType;
  interval: number; // in ms
  isActive: boolean;
  status: MonitorStatus;
  n: number; // Number of consecutive successes required to change status
  lastCheckedAt?: Date;
  latestChecks: {
    status: MonitorStatus;
    responseTime: number;
    checkedAt: Date;
  }[];
  notificationChannels?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorSchema = new Schema<IMonitor>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true },
    secret: { type: String, required: false },
    type: {
      type: String,
      required: true,
      enum: MonitorTypes,
    },
    interval: { type: Number, required: true, default: 60000 },
    isActive: { type: Boolean, required: true, default: true },
    status: {
      type: String,
      required: true,
      default: "initializing",
      enum: MonitorStatuses,
    },
    n: { type: Number, required: true, default: 1 },
    lastCheckedAt: { type: Date },
    latestChecks: {
      type: [
        {
          status: {
            type: String,
            required: true,
            enum: MonitorStatuses,
          },
          responseTime: { type: Number, required: true },
          checkedAt: { type: Date, required: true },
        },
      ],
      default: [],
    },
    notificationChannels: {
      type: [{ type: Schema.Types.ObjectId, ref: "NotificationChannel" }],
      default: [],
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MonitorSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const monitorId = this._id;
      await Check.deleteMany({ "metadata.monitorId": monitorId });
      await MonitorStats.deleteMany({ monitorId });
      next();
    } catch (error: any) {
      next(error);
    }
  }
);

MonitorSchema.pre(
  "deleteMany",
  { document: false, query: true },
  async function (next) {
    try {
      const filter = this.getFilter();
      const monitors = await this.model.find(filter).select("_id");
      const monitorIds = monitors.map((m) => m._id);
      if (monitorIds.length > 0) {
        await Check.deleteMany({ "metadata.monitorId": { $in: monitorIds } });
        await MonitorStats.deleteMany({ monitorId: { $in: monitorIds } });
      }
      next();
    } catch (error: any) {
      next(error);
    }
  }
);

MonitorSchema.index({ isActive: 1 });
MonitorSchema.index({ status: 1 });
MonitorSchema.index({ type: 1 });
MonitorSchema.index({ lastCheckedAt: 1 });
MonitorSchema.index({ isActive: 1, status: 1 });
MonitorSchema.index({ createdBy: 1 });
MonitorSchema.index({ updatedBy: 1 });

export const Monitor = mongoose.model<IMonitor>("Monitor", MonitorSchema);
