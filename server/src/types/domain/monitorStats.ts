export interface MonitorStats {
  id: string;
  monitorId: string;
  avgResponseTime: number;
  maxResponseTime: number;
  lastResponseTime: number;
  totalChecks: number;
  totalUpChecks: number;
  totalDownChecks: number;
  uptimePercentage: number;
  lastCheckTimestamp: number;
  timeOfLastFailure: number;
  currentStreak: number;
  currentStreakStatus?: string;
  currentStreakStartedAt?: number;
  certificateExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
