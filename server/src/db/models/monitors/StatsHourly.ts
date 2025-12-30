import mongoose, { Schema, Types } from "mongoose";
import type { MonitorType } from "@/db/models/monitors/Monitor.js";

// Common/base metrics across monitor types
export interface IStatsBase {
  monitorId: Types.ObjectId;
  teamId: Types.ObjectId;
  type: MonitorType;
  windowStart: Date; // inclusive
  windowEnd: Date; // exclusive
  finalized: boolean;
  count: number; // number of checks in window
  avgResponseTime: number; // ms
  upChecks?: number;
  downChecks?: number;
  avgResponseTimeUp?: number;
  avgResponseTimeDown?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pagespeed rollups (averages per window)
export interface IPageSpeedMetrics {
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  performance?: number;
  cls?: number;
  si?: number;
  fcp?: number;
  lcp?: number;
  tbt?: number;
}

// Infrastructure rollups
export interface IInfraCpu {
  physical_core?: number;
  logical_core?: number;
  frequency?: number;
  current_frequency?: number;
  temperature?: number[]; // averaged per sensor index
  free_percent?: number;
  used_percent?: number;
}

export interface IInfraMemory {
  total_bytes?: number;
  available_bytes?: number;
  used_bytes?: number;
  usage_percent?: number;
}

export interface IInfraDiskEntry {
  device?: string;
  total_bytes?: number;
  free_bytes?: number;
  used_bytes?: number;
  usage_percent?: number;
  total_inodes?: number;
  free_inodes?: number;
  used_inodes?: number;
  inodes_usage_percent?: number;
  read_bytes?: number;
  write_bytes?: number;
  read_time?: number;
  write_time?: number;
}

export interface IInfraHost {
  os?: string;
  platform?: string;
  kernel_version?: string;
  pretty_name?: string;
}

export interface IInfraNetEntry {
  name?: string;
  bytes_sent?: number;
  bytes_recv?: number;
  packets_sent?: number;
  packets_recv?: number;
  err_in?: number;
  err_out?: number;
  drop_in?: number;
  drop_out?: number;
  fifo_in?: number;
  fifo_out?: number;
}

export interface IStatsHourly
  extends mongoose.Document,
    IStatsBase,
    IPageSpeedMetrics {
  cpu?: IInfraCpu;
  memory?: IInfraMemory;
  disk?: IInfraDiskEntry[];
  host?: IInfraHost;
  net?: IInfraNetEntry[];
  dockerRunningPercent?: number;
  dockerHealthyPercent?: number;
  dockerRunningContainers?: number;
  dockerHealthyContainers?: number;
  dockerTotalContainers?: number;
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

const StatsHourlySchema = new Schema<IStatsHourly>(
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
    dockerRunningPercent: { type: Number },
    dockerHealthyPercent: { type: Number },
    dockerRunningContainers: { type: Number },
    dockerHealthyContainers: { type: Number },
    dockerTotalContainers: { type: Number },
  },
  { timestamps: true, collection: "stats_hourly" }
);

StatsHourlySchema.index({ monitorId: 1, windowStart: 1 }, { unique: true });

export const StatsHourly = mongoose.model<IStatsHourly>(
  "StatsHourly",
  StatsHourlySchema
);
