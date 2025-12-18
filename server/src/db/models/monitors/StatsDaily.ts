import mongoose, { Schema, Types } from "mongoose";
import type { MonitorType } from "@/db/models/monitors/Monitor.js";
import type {
  IInfraCpu,
  IInfraDiskEntry,
  IInfraHost,
  IInfraMemory,
  IInfraNetEntry,
  IPageSpeedMetrics,
  IStatsBase,
} from "./StatsHourly.js";

export interface IStatsDaily
  extends mongoose.Document,
    IStatsBase,
    IPageSpeedMetrics {
  cpu?: IInfraCpu;
  memory?: IInfraMemory;
  disk?: IInfraDiskEntry[];
  host?: IInfraHost;
  net?: IInfraNetEntry[];
}

const InfraCpuSchema = new Schema<IInfraCpu>(
  {
    physical_core: { type: Number },
    logical_core: { type: Number },
    frequency: { type: Number },
    current_frequency: { type: Number },
    temperature: { type: [Number], default: undefined },
    free_percent: { type: Number },
    used_percent: { type: Number },
  },
  { _id: false }
);

const InfraMemorySchema = new Schema<IInfraMemory>(
  {
    total_bytes: { type: Number },
    available_bytes: { type: Number },
    used_bytes: { type: Number },
    usage_percent: { type: Number },
  },
  { _id: false }
);

const InfraDiskEntrySchema = new Schema<IInfraDiskEntry>(
  {
    device: { type: String },
    total_bytes: { type: Number },
    free_bytes: { type: Number },
    used_bytes: { type: Number },
    usage_percent: { type: Number },
    total_inodes: { type: Number },
    free_inodes: { type: Number },
    used_inodes: { type: Number },
    inodes_usage_percent: { type: Number },
    read_bytes: { type: Number },
    write_bytes: { type: Number },
    read_time: { type: Number },
    write_time: { type: Number },
  },
  { _id: false }
);

const InfraHostSchema = new Schema<IInfraHost>(
  {
    os: { type: String },
    platform: { type: String },
    kernel_version: { type: String },
    pretty_name: { type: String },
  },
  { _id: false }
);

const InfraNetEntrySchema = new Schema<IInfraNetEntry>(
  {
    name: { type: String },
    bytes_sent: { type: Number },
    bytes_recv: { type: Number },
    packets_sent: { type: Number },
    packets_recv: { type: Number },
    err_in: { type: Number },
    err_out: { type: Number },
    drop_in: { type: Number },
    drop_out: { type: Number },
    fifo_in: { type: Number },
    fifo_out: { type: Number },
  },
  { _id: false }
);

const StatsDailySchema = new Schema<IStatsDaily>(
  {
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      index: true,
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      index: true,
      required: true,
    },
    type: { type: String, required: true },
    windowStart: { type: Date, required: true, index: true },
    windowEnd: { type: Date, required: true },
    finalized: { type: Boolean, default: false },
    count: { type: Number, required: true, default: 0 },
    avgResponseTime: { type: Number, required: true, default: 0 },
    upChecks: { type: Number, required: false },
    downChecks: { type: Number, required: false },
    avgResponseTimeUp: { type: Number, required: false },
    avgResponseTimeDown: { type: Number, required: false },

    // Pagespeed
    accessibility: { type: Number },
    bestPractices: { type: Number },
    seo: { type: Number },
    performance: { type: Number },
    cls: { type: Number },
    si: { type: Number },
    fcp: { type: Number },
    lcp: { type: Number },
    tbt: { type: Number },

    // Infrastructure
    cpu: { type: InfraCpuSchema, required: false },
    memory: { type: InfraMemorySchema, required: false },
    disk: { type: [InfraDiskEntrySchema], required: false, default: undefined },
    host: { type: InfraHostSchema, required: false },
    net: { type: [InfraNetEntrySchema], required: false, default: undefined },
  },
  { timestamps: true, collection: "stats_daily" }
);

StatsDailySchema.index({ monitorId: 1, windowStart: 1 }, { unique: true });

export const StatsDaily = mongoose.model<IStatsDaily>(
  "StatsDaily",
  StatsDailySchema
);
