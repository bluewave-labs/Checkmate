import mongoose, { Schema, Document, Types } from "mongoose";
import {
  MonitorType,
  MonitorTypes,
  MonitorStatus,
  MonitorStatuses,
} from "../monitors/Monitor.js";
import type { Response } from "got";
export type GotTimings = Response["timings"];
export interface ITimingPhases {
  wait: number;
  dns: number;
  tcp: number;
  tls: number;
  request: number;
  firstByte: number;
  download: number;
  total: number;
}

export interface ICpuInfo {
  physical_core: number;
  logical_core: number;
  frequency: number;
  current_frequency: number;
  temperature: number[]; // per-core temps
  free_percent: number;
  usage_percent: number;
}

export interface IMemoryInfo {
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  usage_percent: number;
}

export interface IHostInfo {
  os?: string;
  platform?: string;
  kernel_version?: string;
  pretty_name?: string;
}

export interface IDiskInfo {
  device: string;
  total_bytes: number;
  free_bytes: number;
  used_bytes: number;
  usage_percent: number;
  total_inodes?: number;
  free_inodes?: number;
  used_inodes?: number;
  inodes_usage_percent?: number;
  read_bytes?: number;
  write_bytes?: number;
  read_time?: number;
  write_time?: number;
}

export interface INetInfo {
  name: string;
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
  err_in: number;
  err_out: number;
  drop_in: number;
  drop_out: number;
  fifo_in: number;
  fifo_out: number;
}

export interface ICaptureInfo {
  version?: string;
  mode?: string;
}

export interface ISystemInfo {
  cpu: ICpuInfo;
  memory: IMemoryInfo;
  disk: IDiskInfo[];
  host: IHostInfo;
  net: INetInfo[];
}

export interface ILighthouseAudit {
  id?: string;
  title?: string;
  score?: number | null;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
}
export interface ILighthouseCategories {
  accessibility?: { score?: number | null };
  "best-practices"?: { score?: number | null };
  seo?: { score?: number | null };
  performance?: { score?: number | null };
}

export interface ILighthouseResult {
  categories?: ILighthouseCategories;
  audits?: Record<string, ILighthouseAudit>;
}

export interface ICheckLighthouseFields {
  accessibility: number;
  bestPractices: number;
  seo: number;
  performance: number;
  audits: {
    cls: ILighthouseAudit;
    si: ILighthouseAudit;
    fcp: ILighthouseAudit;
    lcp: ILighthouseAudit;
    tbt: ILighthouseAudit;
  };
}

export interface ICheck extends Document {
  _id: Types.ObjectId;
  metadata: {
    monitorId: Types.ObjectId;
    teamId: Types.ObjectId;
    type: MonitorType;
  };
  status: MonitorStatus;
  httpStatusCode?: number;
  message: string;
  responseTime?: number;
  timings?: GotTimings;
  errorMessage?: string;
  ackAt?: Date;
  ackBy?: Types.ObjectId;
  system?: ISystemInfo;
  capture?: ICaptureInfo;
  lighthouse?: ICheckLighthouseFields;
  createdAt: Date;
  updatedAt: Date;
  expiry: Date;
}

const CheckSchema = new Schema<ICheck>(
  {
    metadata: {
      monitorId: {
        type: Schema.Types.ObjectId,
        ref: "Monitor",
        required: true,
      },
      teamId: {
        type: Schema.Types.ObjectId,
        ref: "Team",
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: MonitorTypes,
      },
    },
    status: {
      type: String,
      required: true,
      enum: MonitorStatuses,
    },
    httpStatusCode: { type: Number },

    message: { type: String, trim: true },
    responseTime: { type: Number },
    timings: {
      start: { type: Date },
      socket: { type: Date },
      lookup: { type: Date },
      connect: { type: Date },
      secureConnect: { type: Date },
      response: { type: Date },
      end: { type: Date },
      phases: {
        wait: { type: Number },
        dns: { type: Number },
        tcp: { type: Number },
        tls: { type: Number },
        request: { type: Number },
        firstByte: { type: Number },
        download: { type: Number },
        total: { type: Number },
      },
    },
    system: {
      type: {
        cpu: {
          physical_core: { type: Number },
          logical_core: { type: Number },
          frequency: { type: Number },
          current_frequency: { type: Number },
          temperature: [{ type: Number }],
          free_percent: { type: Number },
          usage_percent: { type: Number },
        },
        memory: {
          total_bytes: { type: Number },
          available_bytes: { type: Number },
          used_bytes: { type: Number },
          usage_percent: { type: Number },
        },
        disk: [
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
        ],
        host: {
          os: { type: String },
          platform: { type: String },
          kernel_version: { type: String },
          pretty_name: { type: String },
        },
        net: [
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
        ],
      },
      required: false,
    },

    capture: {
      type: {
        version: { type: String },
        mode: { type: String },
      },
      required: false,
    },
    lighthouse: {
      accessibility: { type: Number, required: false },
      bestPractices: { type: Number, required: false },
      seo: { type: Number, required: false },
      performance: { type: Number, required: false },
      audits: {
        cls: {
          type: Object,
        },
        si: {
          type: Object,
        },
        fcp: {
          type: Object,
        },
        lcp: {
          type: Object,
        },
        tbt: {
          type: Object,
        },
      },
      type: {
        accessibility: { type: Number },
        bestPractices: { type: Number },
        seo: { type: Number },
        performance: { type: Number },
        audits: {
          cls: { type: Object },
          si: { type: Object },
          fcp: { type: Object },
          lcp: { type: Object },
          tbt: { type: Object },
        },
      },
      required: false,
    },

    errorMessage: { type: String, trim: true },
    ackAt: { type: Date },
    ackBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiry: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 30,
    },
  },
  {
    timestamps: true,
    timeseries: {
      timeField: "createdAt",
      metaField: "metadata",
      granularity: "seconds",
    },
  }
);

export const Check = mongoose.model<ICheck>("Check", CheckSchema);
