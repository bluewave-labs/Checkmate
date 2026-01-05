import type { MonitorStatus, MonitorType } from "@/types/domain/index.js";
import type { GotTimings } from "@/db/models/checks/Check.js";

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

export interface ISystemInfo {
  cpu: ICpuInfo;
  memory: IMemoryInfo;
  disk: IDiskInfo[];
  host: IHostInfo;
  net: INetInfo[];
}

export interface ICaptureInfo {
  version?: string;
  mode?: string;
}

export interface ILighthouseAudit {
  id?: string;
  title?: string;
  score?: number | null;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
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

export interface IDockerContainerHealth {
  healthy: boolean;
  source?: string;
  message?: string;
}

export interface IDockerExposedPort {
  port: string;
  protocol: string;
}

export interface IDockerContainerSummary {
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

export interface CheckEntity {
  id: string;
  monitorId: string;
  teamId: string;
  type: MonitorType;
  status: MonitorStatus;
  httpStatusCode?: number;
  message: string;
  responseTime?: number;
  timings?: GotTimings;
  errorMessage?: string;
  ackAt?: Date;
  ackBy?: string;
  system?: ISystemInfo;
  capture?: ICaptureInfo;
  lighthouse?: ICheckLighthouseFields;
  dockerContainers?: IDockerContainerSummary[];
  createdAt: Date;
  updatedAt: Date;
  expiry: Date;
}

// AggregateCheck reflects the minimal shape needed from aggregation results
// for list/history views, with string ids and optional docker payload.
export interface AggregateCheck {
  // Time bucket identifier from aggregation (_id)
  bucketDate: Date;

  // Common aggregates
  count?: number;
  avgResponseTime?: number;

  // Docker aggregates (counts per bucket)
  totalContainers?: number;
  runningContainers?: number;
  healthyContainers?: number;

  // PageSpeed aggregates
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
  performance?: number | null;
  cls?: number | null;
  si?: number | null;
  fcp?: number | null;
  lcp?: number | null;
  tbt?: number | null;

  // Infrastructure aggregates (optional snapshot/averages)
  cpu?: Partial<ICpuInfo>;
  memory?: Partial<IMemoryInfo>;
  disk?: Partial<IDiskInfo>[];
  host?: Partial<IHostInfo>;
  net?: Array<Pick<INetInfo, "name" | "bytes_recv" | "bytes_sent">>;
}
