export const JOB_TYPES = ["check", "geo-check", "evaluate", "cleanup-orphaned", "cleanup-retention"] as const;
export type JobType = (typeof JOB_TYPES)[number];
export const LOCK_MS = 30_000;
export const BACKOFF_MS = 5_000;
export const PARKED = Number.MAX_SAFE_INTEGER;

// Canonical _id scheme: monitor-bound rows are `${type}:${refId}`; global rows (refId null) are just the type.
export const jobId = (type: JobType, refId: string | null): string => (refId === null ? type : `${type}:${refId}`);

export type Job = {
	id: string;
	type: JobType;
	refId: string | null;
	isActive: boolean;

	// Scheduling fields
	nextScheduledAt: number; // epoch ms; due when nextScheduledAt <= now
	intervalMs: number | null; // repeat period in ms; null = one time job

	// Lock fields
	lockedBy: string | null; // workerId holding the lease
	lockedUntil: number | null; // epoch ms; lease expiry => reclaimable after a crash

	// observability (replaces what getMetrics/getJobs)
	runCount: number;
	failCount: number;
	lastFinishedAt: number | null;
	lastFailReason: string | null;
};

// These are the only values to set when creating a job.  Repo owns the rest
export type JobSeed = Pick<Job, "id" | "type" | "refId" | "isActive" | "intervalMs" | "nextScheduledAt">;
