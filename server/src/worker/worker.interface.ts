import { HardwareBreaches, Monitor } from "@/domain/monitors/monitor.type.js";
import { Check } from "@/domain/checks/check.type.js";
import { Job, JobType } from "@/domain/jobs/job.type.js";
import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import type { z } from "zod";
import type { workerJobFailureSchema, workerJobsPageSchema, workerJobSummarySchema, workerMetricsSchema } from "@/worker/worker.schema.js";

export type JobHandler = (job: Job) => Promise<void>;
export type JobHandlers = Record<JobType, JobHandler>;

export const MonitorTransitions = ["status_down", "status_up", "threshold_breach", "threshold_resolved"] as const;
export type MonitorTransition = (typeof MonitorTransitions)[number];

export interface MonitorActionDecision {
	transition: MonitorTransition | null;
	thresholdBreaches?: HardwareBreaches;
}

export type MonitorEvaluation = {
	monitor: Monitor;
	check: Check;
	decision: MonitorActionDecision;
};

export type WorkerJobFailure = z.infer<typeof workerJobFailureSchema>;
export type WorkerMetrics = z.infer<typeof workerMetricsSchema>;
export type WorkerJobSummary = z.infer<typeof workerJobSummarySchema>;

export type WorkerJobsPagination = {
	page?: number;
	rowsPerPage?: number;
};

export type WorkerJobsPage = z.infer<typeof workerJobsPageSchema>;

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
