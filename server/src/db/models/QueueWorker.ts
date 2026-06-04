import { Schema, model } from "mongoose";
import { QueueModes, type QueueMode } from "@/types/settings.js";

// Heartbeat presence record for a scheduler instance. _id is the scheduler's
// workerId (hostname:pid:uuid). The TTL index on lastSeenAt garbage-collects
// records for instances that have stopped heartbeating.
interface QueueWorkerDocument {
	_id: string;
	mode: QueueMode;
	lastSeenAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const QueueWorkerSchema = new Schema<QueueWorkerDocument>(
	{
		_id: { type: String, required: true },
		mode: { type: String, enum: QueueModes, required: true },
		lastSeenAt: { type: Date, default: Date.now, expires: 30 },
	},
	{ timestamps: true }
);

const QueueWorkerModel = model<QueueWorkerDocument>("QueueWorker", QueueWorkerSchema);

export type { QueueWorkerDocument };
export { QueueWorkerModel };
export default QueueWorkerModel;
