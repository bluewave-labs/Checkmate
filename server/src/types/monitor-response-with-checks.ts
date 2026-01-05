import { IMonitorStats } from "@/db/models/index.js";
import type { Monitor } from "@/types/domain/index.js";
import type { AggregateCheck } from "@/types/domain/index.js";
export interface MonitorWithChecksResponse {
  monitor: Monitor;
  checks: Array<AggregateCheck>;
  stats: IMonitorStats;
}
