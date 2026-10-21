import { Schema, model } from "mongoose";
import { QueueModes, type QueueMode } from "@/domain/app-settings/app-settings.type.js";
import { EgressStatuses, type EgressProbeResult, type EgressStatus } from "@/domain/egress/egress.type.js";

const probeResultSchema = new Schema<EgressProbeResult>(
	{
		target: { type: String, required: true },
		reachable: { type: Boolean, required: true },
		responseTime: { type: Number, default: 0 },
		message: { type: String },
	},
	{ _id: false }
);

interface WorkerEgressDocument {
	status: EgressStatus;
	checkedAt: Date;
	degradedSince: Date | null;
	lastProbeResults: EgressProbeResult[];
}

const workerEgressSchema = new Schema<WorkerEgressDocument>(
	{
		status: { type: String, enum: EgressStatuses, required: true },
		checkedAt: { type: Date, required: true },
		degradedSince: { type: Date },
		lastProbeResults: { type: [probeResultSchema] },
	},
	{ _id: false }
);

interface QueueWorkerDocument {
	_id: string;
	mode: QueueMode;
	processesJobs: boolean;
	lastSeenAt: Date;
	egress?: WorkerEgressDocument;
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
		egress: { type: workerEgressSchema, default: undefined },
	},
	{ timestamps: true }
);

const QueueWorkerModel = model<QueueWorkerDocument>("QueueWorker", QueueWorkerSchema);

export type { QueueWorkerDocument, WorkerEgressDocument };
export { QueueWorkerModel };
export default QueueWorkerModel;
