import { Monitor } from "@/types/monitor.js";

export type QueueJobFailure = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	failedAt: number | null;
	failCount: number;
	failReason: string | null;
};

export type QueueMetrics = {
	jobs: number;
	activeJobs: number;
	failingJobs: number;
	jobsWithFailures: QueueJobFailure[];
	totalRuns: number;
	totalFailures: number;
};

export type QueueJobSummary = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	monitorInterval: number | null;
	monitorGeoInterval: number | null;
	monitorActive: boolean | null;
	active: boolean;
	lockedAt: number | null;
	runCount: number;
	failCount: number;
	failReason: string | null;
	lastFinishedAt: number | null;
	lastRunTook: number | null;
	lastFailedAt: number | null;
	repeat: number | null;
};

export interface IJobQueue {
	readonly serviceName: string;
	init(): Promise<boolean>;
	addJob(monitorId: string, monitor: Monitor): Promise<void>;
	deleteJob(monitor: Monitor): Promise<void>;
	pauseJob(monitor: Monitor): Promise<void>;
	resumeJob(monitor: Monitor): Promise<void>;
	updateJob(monitor: Monitor): Promise<void>;
	shutdown(): Promise<void>;
	getMetrics(): Promise<QueueMetrics>;
	getJobs(): Promise<QueueJobSummary[]>;
	flushQueues(): Promise<{ success: boolean }>;
}
