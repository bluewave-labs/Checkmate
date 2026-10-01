import { Schema, model } from "mongoose";
import { QueueModes, type QueueMode } from "@/domain/app-settings/app-settings.type.js";

interface QueueWorkerDocument {
	_id: string;
	mode: QueueMode;
	processesJobs: boolean;
	lastSeenAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

// Single source of truth for worker liveness: the TTL that GCs stale records and
// the window readers use to count a worker as alive. Heartbeat cadence must stay well below it.
const WORKER_TTL_SECONDS = 180;
export const WORKER_STALE_MS = WORKER_TTL_SECONDS * 1000;

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
