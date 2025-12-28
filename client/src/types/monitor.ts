import type { GroupedCheck, ICheck } from "@/types/check";
import type { IMonitorStats } from "./monitorStats";

export const MonitorTypes = [
  "http",
  "https",
  "port",
  "ping",
  "infrastructure",
  "pagespeed",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const UptimeMonitorTypes = ["http", "https", "port", "ping"] as const;
export type UptimeMonitorType = (typeof UptimeMonitorTypes)[number];

export const MonitorStatuses = [
  "up",
  "down",
  "paused",
  "initializing",
] as const;

export type MonitorStatus = (typeof MonitorStatuses)[number];

export interface IMonitor {
  checks: ICheck[];
  createdAt: string;
  createdBy: string;
  interval: number;
  rejectUnauthorized: boolean;
  latestChecks: ICheck[];
  n: number;
  name: string;
  port: number;
  notificationChannels: string[];
  status: MonitorStatus;
  type: string;
  updatedAt: string;
  updatedBy: string;
  url: string;
  secret: string;
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
    temperature: number;
  };
  __v: number;
  _id: string;
}

export interface IMonitorWithStats {
  count: number;
  downCount: number;
  upCount: number;
  pausedCount: number;
  monitors: IMonitor[];
}

export interface IMonitorWithMonitorStats {
  checks: GroupedCheck[];
  monitor: IMonitor;
  stats: IMonitorStats;
}
