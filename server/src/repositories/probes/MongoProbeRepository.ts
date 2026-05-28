import mongoose from "mongoose";
import { ProbeServerModel } from "@/db/models/index.js";
import type { ProbeServerDocument } from "@/db/models/ProbeServer.js";
import type { ProbeServer, ProbeServerSummary } from "@/types/script.js";
import { AppError } from "@/utils/AppError.js";
import type { IProbeRepository, RegisterProbeInput } from "@/repositories/probes/IProbeRepository.js";

const SERVICE_NAME = "MongoProbeRepository";

const toEntity = (doc: ProbeServerDocument): ProbeServer => {
	const toStringId = (value: unknown): string => {
		if (value instanceof mongoose.Types.ObjectId) {
			return value.toString();
		}
		return value?.toString() ?? "";
	};
	const toDateString = (value: Date | string | undefined): string => {
		if (!value) return "";
		return value instanceof Date ? value.toISOString() : value;
	};
	return {
		id: toStringId(doc._id),
		teamId: toStringId(doc.teamId),
		name: doc.name,
		url: doc.url,
		probeSecret: doc.probeSecret,
		isActive: doc.isActive,
		lastSeen: doc.lastSeen ? toDateString(doc.lastSeen) : undefined,
		createdAt: toDateString(doc.createdAt),
		updatedAt: toDateString(doc.updatedAt),
	};
};

const toSummary = (probe: ProbeServer): ProbeServerSummary => {
	const { probeSecret, ...rest } = probe;
	void probeSecret;
	return rest;
};

class MongoProbeRepository implements IProbeRepository {
	register = async (input: RegisterProbeInput): Promise<ProbeServerSummary> => {
		const model = new ProbeServerModel({
			teamId: input.teamId,
			name: input.name,
			url: input.url,
			probeSecret: input.probeSecretHashed,
			isActive: true,
		});
		const saved = await model.save();
		return toSummary(toEntity(saved));
	};

	findById = async (probeId: string, teamId: string): Promise<ProbeServer> => {
		if (!mongoose.Types.ObjectId.isValid(probeId)) {
			throw new AppError({ message: "Invalid probe ID", status: 400, service: SERVICE_NAME, method: "findById" });
		}
		const doc = await ProbeServerModel.findOne({ _id: probeId, teamId });
		if (!doc) {
			throw new AppError({ message: `Probe with ID ${probeId} not found`, status: 404, service: SERVICE_NAME, method: "findById" });
		}
		return toEntity(doc);
	};

	findByTeamId = async (teamId: string): Promise<ProbeServerSummary[]> => {
		const docs = await ProbeServerModel.find({ teamId }).sort({ createdAt: -1 });
		return docs.map((doc) => toSummary(toEntity(doc as ProbeServerDocument)));
	};

	updateLastSeen = async (probeId: string, teamId: string): Promise<void> => {
		if (!mongoose.Types.ObjectId.isValid(probeId)) {
			throw new AppError({ message: "Invalid probe ID", status: 400, service: SERVICE_NAME, method: "updateLastSeen" });
		}
		await ProbeServerModel.updateOne({ _id: probeId, teamId }, { $set: { lastSeen: new Date() } });
	};

	deactivate = async (probeId: string, teamId: string): Promise<void> => {
		if (!mongoose.Types.ObjectId.isValid(probeId)) {
			throw new AppError({ message: "Invalid probe ID", status: 400, service: SERVICE_NAME, method: "deactivate" });
		}
		const result = await ProbeServerModel.updateOne({ _id: probeId, teamId }, { $set: { isActive: false } });
		if (result.matchedCount === 0) {
			throw new AppError({ message: `Probe with ID ${probeId} not found`, status: 404, service: SERVICE_NAME, method: "deactivate" });
		}
	};
}

export { MongoProbeRepository };
export default MongoProbeRepository;
