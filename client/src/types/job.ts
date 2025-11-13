import type { IMonitor } from "./monitor";
export interface IJob {
  active: boolean;
  id: string;
  data: IMonitor;
  lastFinishedAt: number;
  lastRunAt: number;
  lastRunTook: number;
  lockedAt: number | null;
  repeat: number;
  runCount: number;
  template: string;
}

export interface IJobMetrics {
  jobs: number;
  activeJobs: number;
  failingJobs: number;
  jobsWithFailures: Array<{
    monitorId: string | number;
    monitorUrl: string | null;
    monitorType: string | null;
    failedAt: number | null;
    failCount: number | null;
    failReason: string | null;
  }>;
  totalRuns: number;
  totalFailures: number;
}
