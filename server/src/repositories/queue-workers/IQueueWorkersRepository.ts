import type { QueueMode, QueueWorker } from "@/types/settings.js";

export interface IQueueWorkersRepository {
	upsert(workerId: string, mode: QueueMode): Promise<void>;
	findRecent(maxAgeMs: number): Promise<QueueWorker[]>;
	deleteById(workerId: string): Promise<void>;
}
