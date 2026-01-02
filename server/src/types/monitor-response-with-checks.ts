import { IMonitorStats } from "@/db/models/index.js";
import type { Monitor } from "@/types/domain/index.js";
export interface MonitorWithChecksResponse {
  monitor: Monitor;
  checks: Array<{
    _id: string;
    count: number;
    avgResponseTime: number;
  }>;
  stats: IMonitorStats;
}
