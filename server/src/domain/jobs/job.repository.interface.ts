import { Job, JobSeed, JobType } from "@/domain/jobs/job.type.js";

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

	// Completes a repeating job
	recordSuccess(id: string, nextScheduledAt: number, intervalMs: number, now: number): Promise<boolean>;

	// Record failure, release lease, bump fail count, record reason, reset nextScheduledAt for retry
	recordFailure(id: string, error: unknown, now: number): Promise<boolean>;

	recordOneShot(id: string, now: number): Promise<boolean>;

	// ********************
	// Hand off to evaluator // This is accomplished by creating an "evaluation" type job
	// ********************
	upsertEvaluate(monitorId: string, now: number): Promise<boolean>;

	// ********************
	// Job CRUD
	// ********************

	// Create jobs. Takes a JobSeed
	upsertJob(job: JobSeed): Promise<boolean>;

	// Pause/Resume
	setActiveById(refId: string, isActive: boolean): Promise<boolean>;

	// Edit job schedule
	updateScheduleById(refId: string, type: JobType, intervalMs: number | null): Promise<boolean>;

	// Delete, drop all rows
	deleteById(refId: string): Promise<boolean>;

	// Delete a single job of type
	deleteByIdAndType(refId: string, type: JobType): Promise<boolean>;

	// Get job
	findById(refId: string): Promise<Job[]>;

	// ********************
	// Observability
	// ********************
	findPage(pagination: JobPageQuery): Promise<JobPage>;
	findAll(): Promise<Job[]>;
}
