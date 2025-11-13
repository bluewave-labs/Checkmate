import type { MonitorStatus } from "@/types//monitor";

export interface IMonitorStats {
  monitorId: string;
  avgResponseTime: number;
  maxResponseTime: number;
  totalChecks: number;
  totalUpChecks: number;
  totalDownChecks: number;
  uptimePercentage: number;
  lastCheckTimestamp: number;
  lastResponseTime: number;
  timeOfLastFailure: number;
  currentStreak: number;
  currentStreakStatus: MonitorStatus;
  currentStreakStartedAt: number;
  createdAt: Date;
  updatedAt: Date;
}
