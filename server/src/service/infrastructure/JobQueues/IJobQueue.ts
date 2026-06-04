import { Monitor } from "@/types/monitor.js";
import { QueueWorker } from "@/types/settings.js";

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
	workers: QueueWorker[];
};

export type QueueJobSummary = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	monitorInterval: number | null;
	monitorGeoInterval: number | null;
	monitorActive: boolean | null;
	active: boolean;
	lockedBy: string | null;
	lockedUntil: number | null;
	lockedAt: number | null;
	runCount: number;
	failCount: number;
	failReason: string | null;
	lastRunAt: number | null;
	lastFinishedAt: number | null;
	lastRunTook: number | null;
	lastFailedAt: number | null;
	repeat: number | null;
};

export type QueueJobsPagination = {
	page?: number;
	rowsPerPage?: number;
};

export type QueueJobsPage = {
	jobs: QueueJobSummary[];
	count: number;
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
	getJobs(pagination: QueueJobsPagination): Promise<QueueJobsPage>;
	flushQueues(): Promise<{ success: boolean }>;
}
