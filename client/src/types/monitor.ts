import type { GroupedCheck, ICheck } from "@/types/check";
import type { IMonitorStats } from "./monitorStats";

export const MonitorTypes = [
  "http",
  "https",
  "ping",
  "infrastructure",
  "pagespeed",
] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const UptimeMonitorTypes = ["http", "https", "ping"] as const;
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
  isActive: boolean;
  latestChecks: ICheck[];
  n: number;
  name: string;
  notificationChannels: string[];
  status: MonitorStatus;
  type: string;
  updatedAt: string;
  updatedBy: string;
  url: string;
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
