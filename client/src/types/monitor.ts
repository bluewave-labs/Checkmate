import type { AggregateCheck, Check } from "@/types/check";
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
  "resuming",
] as const;

export type MonitorStatus = (typeof MonitorStatuses)[number];

export interface IMonitor {
  id: string;
  checks: Check[];
  createdAt: string;
  createdBy: string;
  interval: number;
  rejectUnauthorized: boolean;
  latestStatuses: MonitorStatus[];
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
}

export interface IMonitorWithStats {
  count: number;
  downCount: number;
  upCount: number;
  pausedCount: number;
  monitors: IMonitor[];
  checksMap: Record<string, Check[]>;
}

export interface IMonitorWithMonitorStats {
  checks: AggregateCheck[];
  monitor: IMonitor;
  stats: IMonitorStats;
}
