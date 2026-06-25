import type { MonitorType } from "./Monitor";

export const QueueModes = ["primary", "worker"] as const;
export type QueueMode = (typeof QueueModes)[number];

export type QueueWorker = {
	workerId: string; // hostname:pid:uuid
	mode: QueueMode;
	lastSeenAt: number; // epoch ms of the last heartbeat
};

export interface QueueJobFailure {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: MonitorType | null;
	failedAt: number | null;
	failCount: number;
	failReason: string | null;
}

export type QueueMetrics = {
	jobs: number;
	activeJobs: number;
	failingJobs: number;
	jobsWithFailures: QueueJobFailure[];
	totalRuns: number;
	totalFailures: number;
	workers: QueueWorker[];
};

export type QueueJobSummary = {
	monitorId: string | number;
	monitorType: string | null;
	monitorInterval: number | null;
	monitorActive: boolean | null;
	lockedBy: string | null;
	lockedUntil: number | null;
	nextScheduledAt: number;
	runCount: number;
	failCount: number;
	failReason: string | null;
	lastFinishedAt: number | null;
};

export interface QueueData {
	jobs: QueueJobSummary[];
	count: number;
	metrics: QueueMetrics;
}
