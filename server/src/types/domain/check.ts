import type { MonitorStatus } from "@/types/domain/index.js";

export interface CheckEntityBase {
  id: string;
  monitorId: string;
  status: MonitorStatus;
  responseTime: number;
  createdAt: Date;
}

// Optional payloads for different monitor types
export interface PageSpeedPayload {
  lighthouse?: Record<string, unknown>;
}

export interface InfraCpuMetrics {
  physical_core?: number;
  logical_core?: number;
  frequency?: number;
  current_frequency?: number;
  temperature?: Array<{ sensor?: string; value?: number }>;
  free_percent?: number;
  usage_percent?: number;
}

export interface InfraMemoryMetrics {
  total_bytes?: number;
  available_bytes?: number;
  used_bytes?: number;
  usage_percent?: number;
}

export interface InfraDiskMetrics {
  device?: string;
  mountpoint?: string;
  fs_type?: string;
  total_bytes?: number;
  used_bytes?: number;
  usage_percent?: number;
}

export interface InfraNetMetrics {
  iface?: string;
  rx_bytes?: number;
  tx_bytes?: number;
}

export interface InfraHostInfo {
  os?: string;
  platform?: string;
  kernel_version?: string;
  pretty_name?: string;
}

export interface InfraPayload {
  system?: {
    cpu?: InfraCpuMetrics;
    memory?: InfraMemoryMetrics;
    disk?: InfraDiskMetrics[];
    net?: InfraNetMetrics[];
    host?: InfraHostInfo;
  };
}

export interface DockerHealth {
  healthy?: boolean;
  source?: string;
  message?: string;
}

export interface DockerExposedPort {
  port?: string;
  protocol?: string;
}

export interface DockerContainerSummary {
  container_id?: string;
  container_name?: string;
  status?: string;
  health?: DockerHealth;
  running?: boolean;
  base_image?: string;
  exposed_ports?: DockerExposedPort[];
  started_at?: number;
  finished_at?: number;
}

export interface DockerPayload {
  data?: DockerContainerSummary[];
  capture?: Record<string, unknown>;
}

export type CheckEntity = CheckEntityBase &
  Partial<PageSpeedPayload> &
  Partial<InfraPayload> &
  Partial<DockerPayload>;
