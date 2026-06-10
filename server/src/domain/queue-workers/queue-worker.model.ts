import { Schema, model } from "mongoose";
import { QueueModes } from "@/domain/app-settings/app-settings.type.js";
import { QueueWorkerDocument } from "@/domain/queue-workers/queue-worker.type.js";

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
