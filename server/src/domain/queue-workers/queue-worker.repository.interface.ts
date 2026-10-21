import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import type { QueueWorker, WorkerEgress } from "@/domain/queue-workers/queue-worker.type.js";

export interface IQueueWorkersRepository {
	upsert(workerId: string, mode: QueueMode, processesJobs: boolean): Promise<void>;
	findRecent(maxAgeMs: number): Promise<QueueWorker[]>;
	deleteById(workerId: string): Promise<void>;
	setEgress(workerId: string, egress: WorkerEgress): Promise<void>;
}
