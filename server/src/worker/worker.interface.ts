import { Monitor } from "@/domain/monitors/monitor.types.js";
import { Check } from "@/domain/checks/check.type.js";
import { JobType } from "@/domain/jobs/job.type.js";
import { MonitorPayloadMap, MonitorStatusResponse, StatusChangeResult } from "@/types/network.js";
import { MonitorActionDecision } from "@/worker/worker.helper.js";
import { QueueWorker } from "@/domain/queue-workers/queue-worker.type.js";
import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";

export type MonitorEvaluation = {
	monitor: Monitor;
	status: MonitorStatusResponse<MonitorPayloadMap[keyof MonitorPayloadMap]>; // raw result from networkService.requestStatus
	check: Check;
	statusChange: StatusChangeResult; // from statusService.updateMonitorStatus
	decision: MonitorActionDecision; // from MonitorStatusPolicy
};

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

export type WorkerJobsPagination = {
	page?: number;
	rowsPerPage?: number;
};

export type WorkerJobsPage = {
	jobs: WorkerJobSummary[];
	count: number;
};

export type WorkerHealth = {
	workerId: string;
	mode: QueueMode;
	dbConnected: boolean; // mongoose connection readyState === 1
	initComplete: boolean; // init() finished, loops armed
	draining: boolean; // SIGTERM received, no longer claiming
	lastTickAt: number | null; // newest tick across all loops (epoch ms)
	inFlight: number; // total in-flight jobs across types
};
export interface IJobScheduler {
	addJob(monitorId: string, monitor: Monitor): Promise<void>;
	deleteJob(monitor: Monitor): Promise<void>;
	pauseJob(monitor: Monitor): Promise<void>;
	resumeJob(monitor: Monitor): Promise<void>;
	updateJob(monitor: Monitor): Promise<void>;
	wake(type: JobType): void;
	getMetrics(): Promise<WorkerMetrics>;
	getJobs(pagination: WorkerJobsPagination): Promise<WorkerJobsPage>;
	flushQueues(): Promise<{ success: boolean }>;
	init(): Promise<boolean>;
	drain(): Promise<void>;
	shutdown(): Promise<void>;
}

export interface IQueueWorker extends IJobScheduler {
	getHealth(): WorkerHealth;
	countDueBacklog(): Promise<number>;
	countAliveWorkers(): Promise<number>;
}
