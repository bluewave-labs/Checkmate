import { IJobsRepository, JobPageQuery } from "@/domain/jobs/job.repository.interface.js";
import JobModel, { JobDocument } from "@/domain/jobs/job.model.js";
import { JobType, Job, JobSeed, BACKOFF_MS, LOCK_MS, PARKED, jobId } from "@/domain/jobs/job.type.js";

// Cap for rearm interval, never want to wait more than 15s.
const REARM_JITTER_MAX_MS = 15_000;

class MongoJobsRepository implements IJobsRepository {
	constructor(private readonly workerId: string) {}

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

	claimDueBatch = async (type: JobType, limit: number, now: number) => {
		if (limit <= 0) return [];
		const dueAndFree = {
			type,
			isActive: true,
			nextScheduledAt: { $lte: now }, // due
			$or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }], // free or expired lock
		};

		// 1. Pick the oldest-due candidates
		const candidates = await JobModel.find(dueAndFree).sort({ nextScheduledAt: 1 }).limit(limit).select({ _id: 1 }).lean<{ _id: string }[]>();
		if (candidates.length === 0) return [];
		const ids = candidates.map((d) => d._id);

		// 2. lock them. Re-check free/expired so we never steal another worker's live lock
		//    only the rows this updateMany actually flips end up with claimed
		const lockedUntil = now + LOCK_MS;
		await JobModel.updateMany(
			{ _id: { $in: ids }, $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }] },
			{ $set: { lockedBy: this.workerId, lockedUntil } }
		);

		// 3. Read back exactly the rows we now hold from this batch, keyed by the lockedUntil time
		const docs = await JobModel.find({ _id: { $in: ids }, lockedBy: this.workerId, lockedUntil }).lean<JobDocument[]>();
		return docs.map(this.toEntity);
	};

	renewLocks = async (ids: string[], now: number) => {
		if (ids.length === 0) return 0;
		const res = await JobModel.updateMany(
			{ _id: { $in: ids }, lockedBy: this.workerId }, // only locks held by this worker can be renewed
			{ $set: { lockedUntil: now + LOCK_MS } }
		);
		return res.modifiedCount;
	};

	recordSuccess = async (id: string, scheduledRunAt: number, intervalMs: number, now: number) => {
		// Fixed rate job scheduling

		let nextScheduledAt = scheduledRunAt + intervalMs;

		// If the job fell behind, skip the missed runs. Spread the next run with jitter to avoid a herd
		if (nextScheduledAt <= now) {
			nextScheduledAt = now + intervalMs + Math.floor(Math.random() * intervalMs);
		}

		const res = await JobModel.updateOne(
			{
				_id: id,
				lockedBy: this.workerId, // Only the worker that claimed can record success
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
				lockedBy: this.workerId, // Only the worker that claimed can record success
			},
			{
				$set: {
					nextScheduledAt: now + BACKOFF_MS,
					lockedBy: null, // Remove lock
					lockedUntil: null,
					lastFinishedAt: now, // a failed run still finished used in getMetrics for failedAt timestamp
					lastFailReason: error instanceof Error ? error.message : String(error),
				},
				$inc: {
					failCount: 1, // Increment fail count
				},
			}
		);
		return res.modifiedCount === 1;
	};

	recordOneShot = async (id: string, now: number) => {
		const res = await JobModel.updateOne(
			{
				_id: id,
				lockedBy: this.workerId, // Only the worker that claimed can record success
			},
			{
				$set: {
					nextScheduledAt: PARKED,
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

	upsertEvaluate = async (monitorId: string, now: number) => {
		const filter = { type: "evaluate", refId: monitorId };
		const update = {
			$setOnInsert: {
				_id: jobId("evaluate", monitorId),
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
	upsertJob = async (job: JobSeed) => {
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

	upsertCleanupJob = async (job: JobSeed) => {
		const res = await JobModel.updateOne(
			{ _id: job.id },
			{
				$set: {
					type: job.type,
					refId: job.refId,
					isActive: job.isActive,
					intervalMs: job.intervalMs,
					nextScheduledAt: job.nextScheduledAt,
				},
				$setOnInsert: {
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

	markMonitorsDue = async (monitorIds: string[], now: number) => {
		if (monitorIds.length === 0) return 0;
		const res = await JobModel.updateMany({ refId: { $in: monitorIds }, type: { $in: ["check", "geo-check"] } }, [
			{
				// Spread rearmed jobs, but never for more than rearm jitter max
				$set: {
					nextScheduledAt: {
						$add: [now, { $floor: { $multiply: [{ $rand: {} }, { $min: ["$intervalMs", REARM_JITTER_MAX_MS] }] } }],
					},
				},
			},
		]);
		return res.modifiedCount;
	};

	deleteById = async (refId: string) => {
		const res = await JobModel.deleteMany({ refId }); // Delete all jobs for monitor
		return res.deletedCount > 0;
	};

	deleteByIdAndType = async (refId: string, type: JobType) => {
		const res = await JobModel.deleteOne({ refId, type }); // Delete a single typed row, e.g. just the geo row
		return res.deletedCount > 0;
	};

	deleteByMonitorIdsNotIn = async (monitorIds: string[]): Promise<number> => {
		// remove jobs who'se refId is not null (cleanup jobs) and not in the list of monitor IDs (orphaned monitor jobs)
		const res = await JobModel.deleteMany({ refId: { $ne: null, $nin: monitorIds } });
		return res.deletedCount ?? 0;
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

	countDueBacklog = async (now: number) => {
		return JobModel.countDocuments({
			type: "check",
			isActive: true,
			nextScheduledAt: { $lte: now },
			$or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }], // free or expired lock
		});
	};
}

export default MongoJobsRepository;
