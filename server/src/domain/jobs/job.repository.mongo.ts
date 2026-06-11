import { IJobsRepository, JobPageQuery } from "@/domain/jobs/job.repository.interface.js";
import JobModel, { JobDocument } from "@/domain/jobs/job.model.js";
import { JobType, Job, BACKOFF_MS, LOCK_MS } from "@/domain/jobs/job.type.js";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";

class MongoJobsRepository implements IJobsRepository {
	private readonly workerId = `${hostname()}:${process.pid}:${randomUUID()}`;

	private toEntity(doc: JobDocument): Job {
		return {
			id: doc._id,
			type: doc.type,
			refId: doc.refId,
			isActive: doc.isActive,
			nextScheduledAt: doc.nextScheduledAt,
			intervalMs: doc.intervalMs,
			lockedBy: doc.lockedBy,
			lockedUntil: doc.lockedUntil,
			runCount: doc.runCount,
			failCount: doc.failCount,
			lastFinishedAt: doc.lastFinishedAt,
			lastFailReason: doc.lastFailReason,
		};
	}

	claimDue = async (type: JobType, now: number) => {
		const doc = await JobModel.findOneAndUpdate(
			{
				type,
				isActive: true,
				nextScheduledAt: { $lte: now }, // Find due jobs
				$or: [
					{ lockedUntil: null }, // Not locked
					{ lockedUntil: { $lt: now } }, // Free or expired lock
				],
			},
			{
				$set: {
					lockedBy: this.workerId,
					lockedUntil: now + LOCK_MS,
				},
			},
			{
				new: true,
				sort: { nextScheduledAt: 1 }, // Get the oldest due job
			}
		).lean<JobDocument>();
		return doc ? this.toEntity(doc) : null;
	};

	recordSuccess = async (id: string, scheduledRunAt: number, intervalMs: number, now: number) => {
		// Fixed rate job scheduling

		let nextScheduledAt = scheduledRunAt + intervalMs;

		// If the job fell behind, skipped missed runs
		if (nextScheduledAt <= now) {
			nextScheduledAt = now + intervalMs;
		}

		const res = await JobModel.updateOne(
			{
				_id: id,
			},
			{
				$set: {
					nextScheduledAt,
					lockedBy: null, // Remove lock
					lockedUntil: null,
					lastFinishedAt: now,
				},
				$inc: {
					runCount: 1, // Increment run count
				},
			}
		);
		return res.modifiedCount === 1;
	};

	recordFailure = async (id: string, error: unknown, now: number) => {
		const res = await JobModel.updateOne(
			{
				_id: id,
			},
			{
				$set: {
					nextScheduledAt: now + BACKOFF_MS,
					lockedBy: null, // Remove lock
					lockedUntil: null,
					lastFailReason: error instanceof Error ? error.message : String(error),
				},
				$inc: {
					failCount: 1, // Increment fail count
				},
			}
		);
		return res.modifiedCount === 1;
	};

	upsertEvaluate = async (monitorId: string, now: number) => {
		const filter = { type: "evaluate", refId: monitorId };
		const update = {
			$setOnInsert: {
				_id: `evaluate:${monitorId}`,
				// refId and Type inferred from filter
				isActive: true,
				intervalMs: null,
				lockedBy: null,
				lockedUntil: null,
				runCount: 0,
				failCount: 0,
				lastFinishedAt: null,
				lastFailReason: null,
			},
			$min: {
				nextScheduledAt: now, // no op if there is already a pending evaluation that is older
			},
		};
		try {
			const res = await JobModel.updateOne(filter, update, { upsert: true });
			return res.acknowledged;
		} catch (error) {
			// Two callers can race the first insert for the same monitor, so the
			// loser hits a duplicate _id. Retry once, the row now exists, so this becomes the $min.
			if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
				const res = await JobModel.updateOne(filter, update, { upsert: true });
				return res.acknowledged;
			}
			throw error;
		}
	};
	upsertJob = async (job: Job) => {
		const res = await JobModel.updateOne(
			{ _id: job.id },
			{
				$set: {
					// These fields are owned by the monitor, always safe to set
					type: job.type,
					refId: job.refId,
					isActive: job.isActive,
					intervalMs: job.intervalMs,
				},
				$setOnInsert: {
					// These fields are scheduling related, only set on insert so they aren't clobbered
					nextScheduledAt: job.nextScheduledAt,
					lockedBy: null,
					lockedUntil: null,
					runCount: 0,
					failCount: 0,
					lastFinishedAt: null,
					lastFailReason: null,
				},
			},
			{ upsert: true }
		);
		return res.acknowledged;
	};

	setActiveById = async (refId: string, isActive: boolean) => {
		const res = await JobModel.updateMany({ refId }, { $set: { isActive } }); // inverts check and geo check rows together
		return res.modifiedCount > 0;
	};

	updateScheduleById = async (refId: string, type: JobType, intervalMs: number | null) => {
		const res = await JobModel.updateOne({ refId, type }, { $set: { intervalMs } });
		return res.modifiedCount === 1;
	};

	deleteById = async (refId: string) => {
		const res = await JobModel.deleteMany({ refId }); // Delete all jobs for monitor
		return res.deletedCount > 0;
	};

	findById = async (refId: string) => {
		const docs = await JobModel.find({ refId }).lean<JobDocument[]>();
		return docs.map(this.toEntity);
	};

	findPage = async ({ page = 0, rowsPerPage = 0 }: JobPageQuery) => {
		const count = await JobModel.countDocuments();
		const query = JobModel.find().sort({ nextScheduledAt: 1 });
		if (rowsPerPage > 0) query.skip(Math.max(page, 0) * rowsPerPage).limit(rowsPerPage);
		const docs = await query.lean<JobDocument[]>();
		return { jobs: docs.map(this.toEntity), count };
	};

	findAll = async () => {
		const docs = await JobModel.find().lean<JobDocument[]>();
		return docs.map(this.toEntity);
	};
}

export default MongoJobsRepository;
