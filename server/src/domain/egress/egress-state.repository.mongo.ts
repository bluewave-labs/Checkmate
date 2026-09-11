import { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import type { EgressProbeResult, EgressState } from "@/domain/egress/egress.type.js";
import { EgressStateModel, type EgressStateDocument } from "@/domain/egress/egress-state.model.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";

const SERVICE_NAME = "EgressStateRepository";

class MongoEgressStateRepository implements IEgressStateRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: EgressStateDocument): EgressState => {
		return {
			id: toStringId(doc._id),
			status: doc.status,
			degradedSince: doc.degradedSince ? toDateString(doc.degradedSince) : null,
			lastRecoveredAt: doc.lastRecoveredAt ? toDateString(doc.lastRecoveredAt) : null,
			lastProbeAt: doc.lastProbeAt ? toDateString(doc.lastProbeAt) : null,
			lastProbeResults: (doc.lastProbeResults ?? []).map((result) => ({
				target: result.target,
				reachable: result.reachable,
				responseTime: result.responseTime ?? 0,
				...(result.message !== undefined && { message: result.message }),
			})),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	findSingleton = async () => {
		const doc = await EgressStateModel.findOneAndUpdate(
			{ singleton: true },
			{ $setOnInsert: { singleton: true, status: "ok" } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		).lean<EgressStateDocument>();
		return this.toEntity(doc);
	};

	recordProbe = async (results: EgressProbeResult[], now: Date) => {
		const doc = await EgressStateModel.findOneAndUpdate(
			{ singleton: true },
			{ $set: { lastProbeAt: now, lastProbeResults: results }, $setOnInsert: { singleton: true, status: "ok" } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		).lean<EgressStateDocument>();
		return this.toEntity(doc);
	};

	markDegraded = async (results: EgressProbeResult[], now: Date) => {
		// Only the caller that flips ok -> degraded sees a document back; everyone else sees null.
		const doc = await EgressStateModel.findOneAndUpdate(
			{ singleton: true, status: "ok" },
			{ $set: { status: "degraded", degradedSince: now, lastProbeAt: now, lastProbeResults: results } },
			{ new: true }
		).lean<EgressStateDocument>();
		return doc ? this.toEntity(doc) : null;
	};

	markRecovered = async (results: EgressProbeResult[], now: Date) => {
		const doc = await EgressStateModel.findOneAndUpdate(
			{ singleton: true, status: "degraded" },
			{ $set: { status: "ok", lastRecoveredAt: now, lastProbeAt: now, lastProbeResults: results } },
			{ new: true }
		).lean<EgressStateDocument>();
		return doc ? this.toEntity(doc) : null;
	};
}

export default MongoEgressStateRepository;
