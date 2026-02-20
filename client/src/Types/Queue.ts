import type { MonitorType } from "./Monitor";

export interface QueueJobFailure {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: MonitorType | null;
	failedAt: number | null;
	failCount: number;
	failReason: string | null;
}

export interface QueueMetrics {
	jobs: number;
	activeJobs: number;
	failingJobs: number;
	jobsWithFailures: QueueJobFailure[];
	totalRuns: number;
	totalFailures: number;
}

export interface QueueJobSummary {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: MonitorType | null;
	monitorInterval: number | null;
	active: boolean;
	lockedAt: number | null;
	runCount: number;
	failCount: number;
	failReason: string | null;
	lastRunAt: number | null;
	lastFinishedAt: number | null;
	lastRunTook: number | null;
	lastFailedAt: number | null;
}

export interface QueueData {
	jobs: QueueJobSummary[];
	metrics: QueueMetrics;
}
