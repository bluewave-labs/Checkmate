import { Schema, model } from "mongoose";
import { JOB_TYPES, type Job } from "@/domain/jobs/job.type.js";

export interface JobDocument extends Omit<Job, "id"> {
	_id: string;
}

const JobSchema = new Schema<JobDocument>(
	{
		_id: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: JOB_TYPES,
			required: true,
		},
		// monitorId for monitor-bound jobs; null for global cleanup jobs. Kept as a String pointer (no populate).
		refId: {
			type: String,
			default: null,
		},
		// paused monitor => false; the claim scan skips inactive rows (replaces pauseJob/resumeJob)
		isActive: {
			type: Boolean,
			default: true,
		},

		// Scheduling — epoch ms, so the claim/$min queries operate on plain numbers
		nextScheduledAt: {
			type: Number,
			required: true,
		},
		intervalMs: {
			type: Number,
			default: null,
		},

		// Lock / lease
		lockedBy: {
			type: String,
			default: null,
		},
		lockedUntil: {
			type: Number,
			default: null,
		},

		// Observability
		runCount: {
			type: Number,
			default: 0,
		},
		failCount: {
			type: Number,
			default: 0,
		},
		lastFinishedAt: {
			type: Number,
			default: null,
		},
		lastFailReason: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true }
);

// Used for scanning for claims
JobSchema.index({ type: 1, isActive: 1, nextScheduledAt: 1 });
// for findById, upsertEvaluate, deleteById
JobSchema.index({ refId: 1, type: 1 });

const JobModel = model<JobDocument>("Job", JobSchema);

export { JobModel };
export default JobModel;
