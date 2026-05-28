import mongoose from "mongoose";
import { ScriptModel } from "@/db/models/index.js";
import type { ScriptDocument } from "@/db/models/Script.js";
import type { Script, ScriptSummary } from "@/types/script.js";
import { AppError } from "@/utils/AppError.js";
import type { CreateScriptInput, IScriptRepository, UpdateScriptInput } from "@/repositories/scripts/IScriptRepository.js";

const SERVICE_NAME = "MongoScriptRepository";

const toEntity = (doc: ScriptDocument): Script => {
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
		createdBy: toStringId(doc.createdBy),
		name: doc.name,
		description: doc.description ?? "",
		runtime: doc.runtime,
		bodyHash: doc.bodyHash,
		encryptedBody: doc.encryptedBody,
		parameters: (doc.parameters as Record<string, string>) ?? {},
		createdAt: toDateString(doc.createdAt),
		updatedAt: toDateString(doc.updatedAt),
	};
};

const toSummary = (script: Script): ScriptSummary => {
	const { encryptedBody, ...rest } = script;
	void encryptedBody;
	return rest;
};

class MongoScriptRepository implements IScriptRepository {
	create = async (input: CreateScriptInput): Promise<Script> => {
		try {
			const model = new ScriptModel({
				teamId: input.teamId,
				createdBy: input.createdBy,
				name: input.name,
				description: input.description ?? "",
				runtime: input.runtime,
				bodyHash: input.bodyHash,
				encryptedBody: input.encryptedBody,
				parameters: input.parameters ?? {},
			});
			const saved = await model.save();
			return toEntity(saved);
		} catch (error: unknown) {
			if (error instanceof Error && /duplicate key/i.test(error.message)) {
				throw new AppError({
					message: `A script with the name "${input.name}" already exists`,
					service: SERVICE_NAME,
					method: "create",
					status: 409,
				});
			}
			throw error;
		}
	};

	findById = async (scriptId: string, teamId: string): Promise<Script> => {
		if (!mongoose.Types.ObjectId.isValid(scriptId)) {
			throw new AppError({ message: "Invalid script ID", status: 400, service: SERVICE_NAME, method: "findById" });
		}
		const doc = await ScriptModel.findOne({ _id: scriptId, teamId });
		if (!doc) {
			throw new AppError({ message: `Script with ID ${scriptId} not found`, status: 404, service: SERVICE_NAME, method: "findById" });
		}
		return toEntity(doc);
	};

	findByTeamId = async (teamId: string): Promise<ScriptSummary[]> => {
		const docs = await ScriptModel.find({ teamId }, { encryptedBody: 0 }).sort({ updatedAt: -1 });
		return docs.map((doc) => {
			const entity = toEntity(doc as ScriptDocument);
			return toSummary({ ...entity, encryptedBody: "" });
		});
	};

	update = async (scriptId: string, teamId: string, input: UpdateScriptInput): Promise<Script> => {
		if (!mongoose.Types.ObjectId.isValid(scriptId)) {
			throw new AppError({ message: "Invalid script ID", status: 400, service: SERVICE_NAME, method: "update" });
		}
		try {
			const doc = await ScriptModel.findOneAndUpdate({ _id: scriptId, teamId }, { $set: input }, { new: true });
			if (!doc) {
				throw new AppError({ message: `Script with ID ${scriptId} not found`, status: 404, service: SERVICE_NAME, method: "update" });
			}
			return toEntity(doc);
		} catch (error: unknown) {
			if (error instanceof Error && /duplicate key/i.test(error.message)) {
				throw new AppError({
					message: `A script with this name already exists`,
					service: SERVICE_NAME,
					method: "update",
					status: 409,
				});
			}
			throw error;
		}
	};

	delete = async (scriptId: string, teamId: string): Promise<void> => {
		if (!mongoose.Types.ObjectId.isValid(scriptId)) {
			throw new AppError({ message: "Invalid script ID", status: 400, service: SERVICE_NAME, method: "delete" });
		}
		const result = await ScriptModel.deleteOne({ _id: scriptId, teamId });
		if (result.deletedCount === 0) {
			throw new AppError({ message: `Script with ID ${scriptId} not found`, status: 404, service: SERVICE_NAME, method: "delete" });
		}
	};
}

export { MongoScriptRepository };
export default MongoScriptRepository;
