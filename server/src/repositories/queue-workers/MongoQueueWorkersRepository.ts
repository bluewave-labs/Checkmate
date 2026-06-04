import type { QueueMode, QueueWorker } from "@/types/settings.js";
import type { IQueueWorkersRepository } from "./IQueueWorkersRepository.js";
import type { QueueWorkerDocument } from "@/db/models/QueueWorker.js";
import { QueueWorkerModel } from "@/db/models/QueueWorker.js";
const SERVICE_NAME = "MongoQueueWorkersRepository";

class MongoQueueWorkersRepository implements IQueueWorkersRepository {
	static SERVICE_NAME = SERVICE_NAME;

	protected toEntity = (doc: QueueWorkerDocument): QueueWorker => {
		return {
			workerId: doc._id,
			mode: doc.mode,
			lastSeenAt: doc.lastSeenAt.getTime(),
		};
	};

	upsert = async (workerId: string, mode: QueueMode): Promise<void> => {
		await QueueWorkerModel.updateOne({ _id: workerId }, { $set: { mode, lastSeenAt: new Date() } }, { upsert: true });
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
