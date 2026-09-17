import { Job, JobSeed, JobType, PendingCheck } from "@/domain/jobs/job.type.js";

export type JobPageQuery = {
	page?: number;
	rowsPerPage?: number;
};
export type JobPage = {
	jobs: Job[];
	count: number;
};

export interface IJobsRepository {
	// ********************
	// Claims
	// ********************

	// Atomically claim a job
	claimDue(type: JobType, now: number): Promise<Job | null>;

	// locks up to `limit` due rows in one batch
	claimDueBatch(type: JobType, limit: number, now: number): Promise<Job[]>;

	// Extends the locks we still hold. Returns how many were renewed
	renewLocks(ids: string[], now: number): Promise<number>;

	// Completes a repeating job
	recordSuccess(id: string, nextScheduledAt: number, intervalMs: number, now: number): Promise<boolean>;

	// Record failure, release lease, bump fail count, record reason, reset nextScheduledAt for retry
	recordFailure(id: string, error: unknown, now: number): Promise<boolean>;

	recordOneShot(id: string, now: number): Promise<boolean>;

	// ********************
	// Hand off to evaluator // This is accomplished pushing newly inserted Check IDs onto the evaluation row
	// ********************
	upsertEvaluate(monitorId: string, pending: PendingCheck[], now: number): Promise<boolean>;

	// Removes processed checks from the evaluate row.
	pullEvaluated(id: string, checkIds: string[]): Promise<boolean>;

	// ********************
	// Job CRUD
	// ********************

	// Create jobs. Takes a JobSeed
	upsertJob(job: JobSeed): Promise<boolean>;

	// Creates cleanup jobs, these are executed immediately so need their own method
	upsertCleanupJob(job: JobSeed): Promise<boolean>;

	// Pause/Resume
	setActiveById(refId: string, isActive: boolean): Promise<boolean>;

	// Edit job schedule
	updateScheduleById(refId: string, type: JobType, intervalMs: number | null): Promise<boolean>;

	// Re-arm the check/geo-check rows.  Add jitter to prevent herd
	markMonitorsDue(monitorIds: string[], now: number): Promise<number>;

	// Delete, drop all rows
	deleteById(refId: string): Promise<boolean>;

	// Delete a single job of type
	deleteByIdAndType(refId: string, type: JobType): Promise<boolean>;

	// Global rows (refId null) are addressed by their canonical _id, see jobId
	deleteGlobalJob(type: JobType): Promise<boolean>;
	// Delete a global row only if nobody has rescheduled it since it was claimed (nextScheduledAt unchanged)
	deleteGlobalJobIfUnchanged(type: JobType, nextScheduledAt: number): Promise<boolean>;

	// Delete jobs that reference monitors that no longer exist
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;

	// Get job
	findById(refId: string): Promise<Job[]>;

	// ********************
	// Observability
	// ********************
	findPage(pagination: JobPageQuery): Promise<JobPage>;
	findAll(): Promise<Job[]>;
	countDueBacklog(now: number): Promise<number>; // Scaling signal
}
