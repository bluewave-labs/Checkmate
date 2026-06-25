import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import type { IQueueWorkersRepository } from "./queue-worker.repository.interface.js";
import type { QueueWorker } from "@/domain/queue-workers/queue-worker.type.js";
import { QueueWorkerModel, type QueueWorkerDocument } from "@/domain/queue-workers/queue-worker.model.js";
const SERVICE_NAME = "MongoQueueWorkersRepository";

class MongoQueueWorkersRepository implements IQueueWorkersRepository {
	static SERVICE_NAME = SERVICE_NAME;

	protected toEntity = (doc: QueueWorkerDocument): QueueWorker => {
		return {
			workerId: doc._id,
			mode: doc.mode,
			processesJobs: doc.processesJobs,
			lastSeenAt: doc.lastSeenAt.getTime(),
		};
	};

	upsert = async (workerId: string, mode: QueueMode, processesJobs: boolean): Promise<void> => {
		await QueueWorkerModel.updateOne({ _id: workerId }, { $set: { mode, processesJobs, lastSeenAt: new Date() } }, { upsert: true });
	};

	findRecent = async (maxAgeMs: number): Promise<QueueWorker[]> => {
		const cutoff = new Date(Date.now() - maxAgeMs);
		const docs = await QueueWorkerModel.find({ lastSeenAt: { $gte: cutoff } });
		return docs.map(this.toEntity);
	};

	deleteById = async (workerId: string): Promise<void> => {
		await QueueWorkerModel.deleteOne({ _id: workerId });
	};
}

export default MongoQueueWorkersRepository;
