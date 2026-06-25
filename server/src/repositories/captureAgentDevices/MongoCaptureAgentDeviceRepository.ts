import mongoose from "mongoose";
import { CaptureAgentDeviceModel } from "@/db/models/CaptureAgentDevice.js";
import type { CaptureAgentDeviceDocument } from "@/db/models/CaptureAgentDevice.js";
import type { CaptureAgentDevice } from "@/types/captureAgent.js";
import { AppError } from "@/utils/AppError.js";
import type { ICaptureAgentDeviceRepository, CreateCaptureAgentDeviceInput, UpdateCaptureAgentDeviceInput } from "./ICaptureAgentDeviceRepository.js";

const SERVICE_NAME = "MongoCaptureAgentDeviceRepository";

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

const toEntity = (doc: CaptureAgentDeviceDocument): CaptureAgentDevice => ({
	id: toStringId(doc._id),
	captureAgentId: toStringId(doc.captureAgentId),
	teamId: toStringId(doc.teamId),
	name: doc.name,
	hostname: doc.hostname,
	ipAddress: doc.ipAddress ?? undefined,
	os: doc.os,
	authType: doc.authType,
	username: doc.username ?? undefined,
	encryptedPassword: doc.encryptedPassword ?? undefined,
	sshKeyFingerprint: doc.sshKeyFingerprint ?? undefined,
	port: doc.port ?? undefined,
	tags: doc.tags ?? [],
	createdAt: toDateString(doc.createdAt),
	updatedAt: toDateString(doc.updatedAt),
});

class MongoCaptureAgentDeviceRepository implements ICaptureAgentDeviceRepository {
	create = async (input: CreateCaptureAgentDeviceInput): Promise<CaptureAgentDevice> => {
		const model = new CaptureAgentDeviceModel({
			captureAgentId: input.captureAgentId,
			teamId: input.teamId,
			name: input.name,
			hostname: input.hostname,
			ipAddress: input.ipAddress,
			os: input.os,
			authType: input.authType,
			username: input.username,
			encryptedPassword: input.encryptedPassword,
			sshKeyFingerprint: input.sshKeyFingerprint,
			port: input.port,
			tags: input.tags ?? [],
		});
		const saved = await model.save();
		return toEntity(saved);
	};

	findById = async (id: string): Promise<CaptureAgentDevice | null> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid device ID",
				status: 400,
				service: SERVICE_NAME,
				method: "findById",
			});
		}
		const doc = await CaptureAgentDeviceModel.findById(id);
		return doc ? toEntity(doc) : null;
	};

	findByIdAndTeam = async (id: string, teamId: string): Promise<CaptureAgentDevice | null> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid device ID",
				status: 400,
				service: SERVICE_NAME,
				method: "findByIdAndTeam",
			});
		}
		const doc = await CaptureAgentDeviceModel.findOne({ _id: id, teamId });
		return doc ? toEntity(doc) : null;
	};

	findByAgent = async (captureAgentId: string): Promise<CaptureAgentDevice[]> => {
		const docs = await CaptureAgentDeviceModel.find({ captureAgentId }).sort({ createdAt: -1 });
		return docs.map((doc) => toEntity(doc));
	};

	updateById = async (id: string, patch: UpdateCaptureAgentDeviceInput): Promise<CaptureAgentDevice> => {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new AppError({
				message: "Invalid device ID",
				status: 400,
				service: SERVICE_NAME,
				method: "updateById",
			});
		}
		const doc = await CaptureAgentDeviceModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
		if (!doc) {
			throw new AppError({
				message: `Device with ID ${id} not found`,
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
				message: "Invalid device ID",
				status: 400,
				service: SERVICE_NAME,
				method: "deleteById",
			});
		}
		const result = await CaptureAgentDeviceModel.deleteOne({ _id: id });
		return result.deletedCount > 0;
	};

	deleteByAgent = async (captureAgentId: string): Promise<number> => {
		const result = await CaptureAgentDeviceModel.deleteMany({ captureAgentId });
		return result.deletedCount ?? 0;
	};
}

export { MongoCaptureAgentDeviceRepository };
export default MongoCaptureAgentDeviceRepository;
