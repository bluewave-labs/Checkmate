import mongoose, { Schema, Document, Types } from "mongoose";
import {
  MonitorType,
  MonitorTypes,
  MonitorStatus,
  MonitorStatuses,
  ISystemInfo,
  ICaptureInfo,
  ICheckLighthouseFields,
  IDockerContainerHealth,
  IDockerExposedPort,
} from "@/types/domain/index.js";
import type { Response } from "got";
export type GotTimings = Response["timings"];

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
  dockerContainers?: IDockerContainerSummary[];
  createdAt: Date;
  updatedAt: Date;
  expiry: Date;
}

interface IDockerContainerSummary {
  container_id: string;
  container_name: string;
  status: string;
  health?: IDockerContainerHealth;
  running: boolean;
  base_image?: string;
  exposed_ports?: IDockerExposedPort[];
  started_at?: number;
  finished_at?: number;
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

    dockerContainers: [
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

    errorMessage: { type: String, trim: true },
    ackAt: { type: Date },
    ackBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    timeseries: {
      timeField: "createdAt",
      metaField: "metadata",
      granularity: "seconds",
    },
    expireAfterSeconds: 60 * 60 * 24 * 30 * 3, // 3 months
  }
);

CheckSchema.index({ "metadata.monitorId": 1, createdAt: -1 });
CheckSchema.index({ "metadata.teamId": 1, createdAt: -1 });
CheckSchema.index({
  "metadata.teamId": 1,
  "metadata.monitorId": 1,
  createdAt: -1,
});

export const Check = mongoose.model<ICheck>("Check", CheckSchema);
