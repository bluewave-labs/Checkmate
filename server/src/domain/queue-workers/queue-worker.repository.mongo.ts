import type { QueueMode } from "@/domain/app-settings/app-settings.type.js";
import type { IQueueWorkersRepository } from "./queue-worker.repository.interface.js";
import type { QueueWorker, WorkerEgress } from "@/domain/queue-workers/queue-worker.type.js";
import { QueueWorkerModel, type QueueWorkerDocument, type WorkerEgressDocument } from "@/domain/queue-workers/queue-worker.model.js";
const SERVICE_NAME = "MongoQueueWorkersRepository";

class MongoQueueWorkersRepository implements IQueueWorkersRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEgressEntity = (egress: WorkerEgressDocument): WorkerEgress => {
		return {
			status: egress.status,
			checkedAt: egress.checkedAt.getTime(),
			degradedSince: egress.degradedSince ? egress.degradedSince.getTime() : null,
			lastProbeResults: (egress.lastProbeResults ?? []).map((result) => ({
				target: result.target,
				reachable: result.reachable,
				responseTime: result.responseTime ?? 0,
				...(result.message !== undefined && { message: result.message }),
			})),
		};
	};

	private toEntity = (doc: QueueWorkerDocument): QueueWorker => {
		return {
			workerId: doc._id,
			mode: doc.mode,
			processesJobs: doc.processesJobs,
			lastSeenAt: doc.lastSeenAt.getTime(),
			...(doc.egress && { egress: this.toEgressEntity(doc.egress) }),
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

	setEgress = async (workerId: string, egress: WorkerEgress) => {
		await QueueWorkerModel.updateOne({ _id: workerId }, { $set: { egress } }, { runValidators: true });
	};
}

export default MongoQueueWorkersRepository;
