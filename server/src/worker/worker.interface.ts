import { Monitor } from "@/domain/monitors/monitor.types.js";
import { QueueWorker } from "@/domain/queue-workers/queue-worker.type.js";

export type WorkerJobFailure = {
	monitorId: string | number;
	monitorUrl: string | null;
	monitorType: string | null;
	failedAt: number | null;
	failCount: number;
	failReason: string | null;
};

export type WorkerMetrics = {
	jobs: number;
	activeJobs: number;
	failingJobs: number;
	jobsWithFailures: WorkerJobFailure[];
	totalRuns: number;
	totalFailures: number;
	workers: QueueWorker[];
};

export type WorkerJobSummary = {
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

export type WorkerJobsPagination = {
	page?: number;
	rowsPerPage?: number;
};

export type WorkerJobsPage = {
	jobs: WorkerJobSummary[];
	count: number;
};

export interface IWorker {
	readonly serviceName: string;
	init(): Promise<boolean>;
	addJob(monitorId: string, monitor: Monitor): Promise<void>;
	deleteJob(monitor: Monitor): Promise<void>;
	pauseJob(monitor: Monitor): Promise<void>;
	resumeJob(monitor: Monitor): Promise<void>;
	updateJob(monitor: Monitor): Promise<void>;
	shutdown(): Promise<void>;
	getMetrics(): Promise<WorkerMetrics>;
	getJobs(pagination: WorkerJobsPagination): Promise<WorkerJobsPage>;
	flushQueues(): Promise<{ success: boolean }>;
}
