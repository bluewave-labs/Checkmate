import { type QueueMode } from "@/domain/app-settings/app-settings.type.js";

export interface QueueWorkerDocument {
	_id: string;
	mode: QueueMode;
	processesJobs: boolean;
	lastSeenAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type QueueWorker = {
	workerId: string; // hostname:pid:uuid
	mode: QueueMode;
	processesJobs: boolean;
	lastSeenAt: number; // epoch ms of the last heartbeat
};
