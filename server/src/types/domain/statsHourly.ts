import type { MonitorType } from "@/types/domain/index.js";

// Common/base metrics across monitor types
export interface IStatsBase {
  monitorId: string;
  teamId: string;
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

export interface IStatsHourly extends IStatsBase, IPageSpeedMetrics {
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
