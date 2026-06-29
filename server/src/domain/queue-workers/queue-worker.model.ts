import { Schema, model } from "mongoose";
import { QueueModes } from "@/domain/app-settings/app-settings.type.js";
import { QueueWorkerDocument } from "@/domain/queue-workers/queue-worker.type.js";

// Single source of truth for worker liveness: the TTL that GCs stale records and
// the window readers use to count a worker as alive. Heartbeat cadence must stay well below it.
export const WORKER_TTL_SECONDS = 180;

const QueueWorkerSchema = new Schema<QueueWorkerDocument>(
	{
		_id: { type: String, required: true },
		mode: { type: String, enum: QueueModes, required: true },
		processesJobs: { type: Boolean, required: true },
		lastSeenAt: { type: Date, default: Date.now, expires: WORKER_TTL_SECONDS },
	},
	{ timestamps: true }
);

const QueueWorkerModel = model<QueueWorkerDocument>("QueueWorker", QueueWorkerSchema);

export type { QueueWorkerDocument };
export { QueueWorkerModel };
export default QueueWorkerModel;
