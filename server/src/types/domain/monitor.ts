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
  "resuming",
] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export interface MonitorThresholds {
  cpu?: number;
  memory?: number;
  disk?: number;
  temperature?: number;
}

export interface Monitor {
  id: string;
  orgId: string;
  teamId: string;
  name: string;
  url: string;
  port?: number;
  secret?: string;
  type: MonitorType;
  interval: number; // in ms
  rejectUnauthorized: boolean;
  status: MonitorStatus;
  n: number; // Number of consecutive successes required to change status
  thresholds?: MonitorThresholds;
  lastCheckedAt?: Date;
  latestStatuses?: MonitorStatus[];
  notificationChannels?: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
