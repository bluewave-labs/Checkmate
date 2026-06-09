import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import type { QueueWorker } from "@/domain/queue-workers/queue-worker.type.js";

export interface IQueueWorkersRepository {
	upsert(workerId: string, mode: QueueMode): Promise<void>;
	findRecent(maxAgeMs: number): Promise<QueueWorker[]>;
	deleteById(workerId: string): Promise<void>;
}
