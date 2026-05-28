import mongoose from "mongoose";
import { CaptureAgentModel } from "@/db/models/index.js";
import type { CaptureAgentDocument } from "@/db/models/CaptureAgent.js";
import type { CaptureAgent } from "@/types/captureAgent.js";
import { AppError } from "@/utils/AppError.js";
import type { ICaptureAgentRepository, CreateCaptureAgentInput, UpdateCaptureAgentInput } from "./ICaptureAgentRepository.js";

const SERVICE_NAME = "MongoCaptureAgentRepository";

const toStringId = (value: unknown): string => {
	if (value instanceof mongoose.Types.ObjectId) {
		return value.toString();
	}
	return value?.toString() ?? "";
};

const toDateString = (value: Date | string | undefined): string | undefined => {
	if (!value) return undefined;
	return value instanceof Date ? value.toISOString() : value;
};

const toEntity = (doc: CaptureAgentDocument): CaptureAgent => {
	return {
		id: toStringId(doc._id),
		teamId: toStringId(doc.teamId),
		name: doc.name,
		url: doc.url,
		secret: doc.secret,
		agentTokenCipher: doc.agentTokenCipher,
		isActive: doc.isActive,
		canCollectMetrics: doc.canCollectMetrics,
		canExecuteScripts: doc.canExecuteScripts,
		lastSeen: doc.lastSeen ? toDateString(doc.lastSeen) : undefined,
		tags: doc.tags ?? [],
		createdAt: toDateString(doc.createdAt) ?? "",
		updatedAt: toDateString(doc.updatedAt) ?? "",
	};
};

class MongoCaptureAgentRepository implements ICaptureAgentRepository {
	create = async (input: CreateCaptureAgentInput): Promise<CaptureAgent> => {
		const model = new CaptureAgentModel({
			teamId: input.teamId,
			name: input.name,
			url: input.url,
			secret: input.secret,
			agentTokenCipher: input.agentTokenCipher,
			canCollectMetrics: input.canCollectMetrics,
			canExecuteScripts: input.canExecuteScripts,
			tags: input.tags ?? [],
			isActive: true,
		});
		const saved = await model.save();
		return toEntity(saved);
	};

	findById = async (id: string): Promise<CaptureAgent | null> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid capture agent ID",
				status: 400,
				service: SERVICE_NAME,
				method: "findById",
			});
		}
		const doc = await CaptureAgentModel.findById(id);
		return doc ? toEntity(doc) : null;
	};

	findByIdAndTeam = async (id: string, teamId: string): Promise<CaptureAgent | null> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid capture agent ID",
				status: 400,
				service: SERVICE_NAME,
				method: "findByIdAndTeam",
			});
		}
		const doc = await CaptureAgentModel.findOne({ _id: id, teamId });
		return doc ? toEntity(doc) : null;
	};

	findByTeam = async (teamId: string): Promise<CaptureAgent[]> => {
		const docs = await CaptureAgentModel.find({ teamId }).sort({ createdAt: -1 });
		return docs.map((doc) => toEntity(doc));
	};

	updateById = async (id: string, patch: UpdateCaptureAgentInput): Promise<CaptureAgent> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid capture agent ID",
				status: 400,
				service: SERVICE_NAME,
				method: "updateById",
			});
		}
		const doc = await CaptureAgentModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
		if (!doc) {
			throw new AppError({
				message: `Capture agent with ID ${id} not found`,
				status: 404,
				service: SERVICE_NAME,
				method: "updateById",
			});
		}
		return toEntity(doc);
	};

	deleteById = async (id: string): Promise<boolean> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid capture agent ID",
				status: 400,
				service: SERVICE_NAME,
				method: "deleteById",
			});
		}
		const result = await CaptureAgentModel.deleteOne({ _id: id });
		return result.deletedCount > 0;
	};

	touchLastSeen = async (id: string): Promise<void> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return;
		}
		await CaptureAgentModel.updateOne({ _id: id }, { $set: { lastSeen: new Date() } });
	};
}

export { MongoCaptureAgentRepository };
export default MongoCaptureAgentRepository;
