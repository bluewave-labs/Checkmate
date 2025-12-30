import mongoose, { Schema, Document, Types } from "mongoose";
import type { IDockerContainerSummary } from "@/db/models/checks/Check.js";
import {
  Check,
  Incident,
  MonitorStats,
  StatsDaily,
  StatsHourly,
} from "@/db/models/index.js";

export const MonitorTypes = [
  "http",
  "https",
  "port",
  "ping",
  "infrastructure",
  "pagespeed",
  "docker",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const MonitorStatuses = [
  "up",
  "down",
  "paused",
  "initializing",
] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export interface IMonitorThresholds {
  cpu?: number;
  memory?: number;
  disk?: number;
  temperature?: number;
}

export interface LatestCheck {
  status: MonitorStatus;
  responseTime: number;
  checkedAt: Date;
  // Snapshot of containers from the latest docker check (array from payload.data)
  containerSnapshot?: IDockerContainerSummary[];
}
export interface IMonitor extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  teamId: Types.ObjectId;
  name: string;
  url: string;
  port?: number;
  secret?: string;
  type: MonitorType;
  interval: number; // in ms
  rejectUnauthorized: boolean;
  status: MonitorStatus;
  n: number; // Number of consecutive successes required to change status
  thresholds?: IMonitorThresholds;
  lastCheckedAt?: Date;
  latestChecks: LatestCheck[];
  notificationChannels?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ThresholdsSchema = new Schema<IMonitorThresholds>(
  {
    cpu: { type: Number, min: 0, max: 100 },
    memory: { type: Number, min: 0, max: 100 },
    disk: { type: Number, min: 0, max: 100 },
    temperature: { type: Number, min: -50, max: 150 },
  },
  { _id: false }
);

const MonitorSchema = new Schema<IMonitor>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    url: { type: String, required: true, trim: true },
    port: { type: Number, required: false },
    secret: { type: String, required: false },
    type: {
      type: String,
      required: true,
      enum: MonitorTypes,
    },
    interval: { type: Number, required: true, default: 60000 },
    rejectUnauthorized: { type: Boolean, required: true, default: true },
    status: {
      type: String,
      required: true,
      default: "initializing",
      enum: MonitorStatuses,
    },
    n: { type: Number, required: true, default: 1 },
    thresholds: { type: ThresholdsSchema, required: false, default: undefined },
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
          containerSnapshot: {
            type: [
              {
                container_id: { type: String },
                container_name: { type: String },
                status: { type: String },
                health: {
                  healthy: { type: Boolean },
                  source: { type: String },
                  message: { type: String },
                },
                running: { type: Boolean },
                base_image: { type: String },
                exposed_ports: [
                  {
                    port: { type: String },
                    protocol: { type: String },
                  },
                ],
                started_at: { type: Number },
                finished_at: { type: Number },
              },
            ],
            required: false,
            default: undefined,
          },
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
      await StatsHourly.deleteMany({ monitorId });
      await StatsDaily.deleteMany({ monitorId });
      await Incident.deleteMany({ monitorId });
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
        await StatsHourly.deleteMany({ monitorId: { $in: monitorIds } });
        await StatsDaily.deleteMany({ monitorId: { $in: monitorIds } });
        await Incident.deleteMany({ monitorId: { $in: monitorIds } });
      }
      next();
    } catch (error: any) {
      next(error);
    }
  }
);

MonitorSchema.index({ status: 1 });
MonitorSchema.index({ type: 1 });
MonitorSchema.index({ lastCheckedAt: 1 });
MonitorSchema.index({ createdBy: 1 });
MonitorSchema.index({ updatedBy: 1 });
// Common filter keys used across services and routes
MonitorSchema.index({ teamId: 1 });
MonitorSchema.index({ orgId: 1 });

export const Monitor = mongoose.model<IMonitor>("Monitor", MonitorSchema);
