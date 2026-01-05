import type { MonitorStats } from "@/types/domain/index.js";
export interface IMonitorStatsRepository {
  // create
  create: (monitorStatsData: Partial<MonitorStats>) => Promise<MonitorStats>;
  // single fetch
  findByMonitorId: (monitorId: string) => Promise<MonitorStats>;
  // collection fetch
  // update
  updateByMonitorId: (
    monitorId: string,
    updateData: Partial<MonitorStats>
  ) => Promise<MonitorStats>;
  // delete`
  deleteManyExcludedByMonitorIds: (monitorIds: string[]) => Promise<number>;
}

export default IMonitorStatsRepository;
