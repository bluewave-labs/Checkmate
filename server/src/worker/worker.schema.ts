import { z } from "zod";
import { queueWorkerSchema } from "@/domain/queue-workers/queue-worker.schema.js";

export const workerJobFailureSchema = z.object({
	monitorId: z.string(),
	monitorUrl: z.string().nullable(),
	monitorType: z.string().nullable(),
	failedAt: z.number().nullable(),
	failCount: z.number(),
	failReason: z.string().nullable(),
});

export const workerMetricsSchema = z
	.object({
		jobs: z.number(),
		activeJobs: z.number(),
		failingJobs: z.number(),
		jobsWithFailures: z.array(workerJobFailureSchema),
		totalRuns: z.number(),
		totalFailures: z.number(),
		workers: z.array(queueWorkerSchema),
	})
	.meta({ id: "WorkerMetrics" });

export const workerJobSummarySchema = z.object({
	monitorId: z.string(),
	monitorType: z.string().nullable(),
	monitorInterval: z.number().nullable(),
	monitorActive: z.boolean().nullable(),
	lockedBy: z.string().nullable(),
	lockedUntil: z.number().nullable(),
	nextScheduledAt: z.number(),
	runCount: z.number(),
	failCount: z.number(),
	failReason: z.string().nullable(),
	lastFinishedAt: z.number().nullable(),
});

export const workerJobsPageSchema = z
	.object({
		jobs: z.array(workerJobSummarySchema),
		count: z.number(),
	})
	.meta({ id: "WorkerJobsPage" });
