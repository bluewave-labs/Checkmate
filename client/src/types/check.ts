import type { MonitorType } from "./monitor";

export interface CheckTimingPhases {
  wait: number;
  dns: number;
  tcp: number;
  tls: number;
  request: number;
  firstByte: number;
  download: number;
  total: number;
}

export interface CheckTimings {
  start: string;
  socket: string;
  lookup: string;
  connect: string;
  secureConnect: string;
  response: string;
  end: string;
  phases: CheckTimingPhases;
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

export interface ISystemInfo {
  cpu: ICpuInfo;
  memory: IMemoryInfo;
  disk: IDiskInfo[];
  host: IHostInfo;
  net: INetInfo[];
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
export interface ICheck {
  _id: string;
  metadata: {
    monitorId: string;
    type: MonitorType;
    teamId: string;
  };
  status: string;
  message: string;
  responseTime: number;
  normalResponseTime?: number;
  httpStatusCode: number;
  ack: boolean;
  expiry: string;
  createdAt: string;
  updatedAt: string;
  timings: CheckTimings;
  lighthouse?: ICheckLighthouseFields;
  system?: ISystemInfo;
  // Present for docker monitor checks
  dockerContainers?: IDockerContainerSummary[];
}
export interface CheckWithMonitor {
  _id: string;
  metadata: {
    monitorId: {
      _id: string;
      name: string;
    };
    type: string;
    teamId: string;
  };
  status: string;
  message: string;
  responseTime: number;
  normalResponseTime?: number;
  httpStatusCode: number;
  ack: boolean;
  expiry: string;
  createdAt: string;
  updatedAt: string;
  timings: CheckTimings;
}

export interface GroupedCheck {
  _id: string;
  avgResponseTime: number;
  count: number;
  upChecks?: number;
  downChecks?: number;
  avgResponseTimeUp?: number | null;
  avgResponseTimeDown?: number | null;
}

export interface LatestCheck {
  status: string;
  responseTime: number;
  checkedAt: string;
  _id: string;
}

export interface IInfraCheck {
  _id: string;
  avgResponseTime: number;
  count: 9;
  cpu: ICpuInfo;
  memory: IMemoryInfo;
  disk: IDiskInfo[];
  host: IHostInfo;
  net: INetInfo[];
}

export interface IDokcerCheck {
  _id: string;
  avgResponseTime: number;
  avgRespponseTimeUp: number;
  avgResponseTimeDown: number;
  count: number;
  downChecks: number;
  healthyContainers: number;
  runningContainers: number;
  totalContainers: number;
  upChecks: number;
}

export interface IChecksWithCount {
  checks: ICheck[];
  count: number;
}

// Docker types (used by docker monitor checks)
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
  running: boolean;
  base_image: string;
  exposed_ports: IDockerExposedPort[];
  started_at: number;
  finished_at: number;
  health: IDockerContainerHealth;
}
