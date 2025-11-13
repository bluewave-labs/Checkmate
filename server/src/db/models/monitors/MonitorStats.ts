import mongoose, { Schema, Document, Types } from "mongoose";
import { MonitorStatus, MonitorStatuses } from "./Monitor.js";

export interface IMonitorStats extends mongoose.Document {
  monitorId: mongoose.Types.ObjectId;
  avgResponseTime: number;
  maxResponseTime: number;
  totalChecks: number;
  totalUpChecks: number;
  totalDownChecks: number;
  uptimePercentage: number;
  lastCheckTimestamp: number;
  lastResponseTime: number;
  timeOfLastFailure: number;
  currentStreak: number;
  currentStreakStatus: MonitorStatus;
  currentStreakStartedAt: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorStatsSchema = new Schema<IMonitorStats>(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      immutable: true,
      index: true,
    },
    avgResponseTime: {
      type: Number,
      default: 0,
    },
    maxResponseTime: {
      type: Number,
      default: 0,
    },
    lastResponseTime: {
      type: Number,
      default: 0,
    },
    totalChecks: {
      type: Number,
      default: 0,
    },
    totalUpChecks: {
      type: Number,
      default: 0,
    },
    totalDownChecks: {
      type: Number,
      default: 0,
    },
    uptimePercentage: {
      type: Number,
      default: 0,
    },
    lastCheckTimestamp: {
      type: Number,
      default: 0,
    },
    timeOfLastFailure: {
      type: Number,
      default: 0,
    },
    currentStreak: { type: Number, required: false, default: 0 },
    currentStreakStatus: {
      type: String,
      required: false,
      enum: MonitorStatuses,
    },
    currentStreakStartedAt: { type: Number, required: false },
  },
  { timestamps: true }
);

export const MonitorStats = mongoose.model<IMonitorStats>(
  "MonitorStats",
  MonitorStatsSchema
);
