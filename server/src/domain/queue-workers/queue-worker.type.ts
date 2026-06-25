import { type QueueMode } from "@/domain/app-settings/app-settings.type.js";

// Heartbeat presence record for a scheduler instance. _id is the scheduler's
// workerId (hostname:pid:uuid). The TTL index on lastSeenAt garbage-collects
// records for instances that have stopped heartbeating.
export interface QueueWorkerDocument {
	_id: string;
	mode: QueueMode;
	lastSeenAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type QueueWorker = {
	workerId: string; // hostname:pid:uuid
	mode: QueueMode;
	lastSeenAt: number; // epoch ms of the last heartbeat
};
