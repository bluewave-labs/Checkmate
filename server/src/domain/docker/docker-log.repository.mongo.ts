import DockerLogModel, { DockerLogDocument } from "@/domain/docker/docker-log.model.js";
import { IDockerLogsRepository } from "@/domain/docker/docker-log.repository.interface.js";
import { DockerLog } from "@/domain/docker/docker-log.type.js";
import { toDateString, toStringId } from "@/utils/mongoMappers.js";
import mongoose from "mongoose";

const SERVICE_NAME = "DockerLogsRepository";

class MongoDockerLogsRepository implements IDockerLogsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: DockerLogDocument): DockerLog => {
		return {
			id: toStringId(doc._id),
			metadata: {
				monitorId: toStringId(doc.metadata.monitorId),
				teamId: toStringId(doc.metadata.teamId),
				containerId: doc.metadata.containerId,
				containerName: doc.metadata.containerName,
			},
			lines: (doc.lines ?? []).map((line) => ({ ts: line.ts, stream: line.stream, text: line.text ?? "" })),
			gap: doc.gap ?? false,
			checkedAt: toDateString(doc.checkedAt),
			expiry: toDateString(doc.expiry),
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	createDockerLogs = async (logs: Omit<DockerLog, "id" | "createdAt" | "updatedAt">[]): Promise<number> => {
		if (logs.length === 0) return 0;
		const docs = await DockerLogModel.insertMany(
			logs.map((log) => {
				return {
					metadata: {
						monitorId: new mongoose.Types.ObjectId(log.metadata.monitorId),
						teamId: new mongoose.Types.ObjectId(log.metadata.teamId),
						containerId: log.metadata.containerId,
						containerName: log.metadata.containerName,
					},
					lines: log.lines,
					gap: log.gap,
					checkedAt: new Date(log.checkedAt),
					expiry: new Date(log.expiry),
				};
			}),
			{ ordered: false }
		);
		return docs.length;
	};

	findLastLineTimestamp = async (monitorId: string, containerId: string): Promise<string | null> => {
		const doc = await DockerLogModel.findOne({
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			"metadata.containerId": containerId,
		})
			.sort({ checkedAt: -1 })
			.select({ lines: { $slice: -1 } })
			.lean<Pick<DockerLogDocument, "lines">>();
		return doc?.lines?.[0]?.ts ?? null;
	};

	findByContainerName = async ({
		monitorId,
		containerName,
		before,
		limit,
	}: {
		monitorId: string;
		containerName: string;
		before?: Date;
		limit: number;
	}): Promise<DockerLog[]> => {
		const docs = await DockerLogModel.find({
			"metadata.monitorId": new mongoose.Types.ObjectId(monitorId),
			"metadata.containerName": containerName,
			...(before ? { checkedAt: { $lt: before } } : {}),
		})
			.sort({ checkedAt: -1 })
			.limit(limit)
			.lean<DockerLogDocument[]>();
		return docs.map(this.toEntity);
	};

	deleteByMonitorId = async (monitorId: string) =>
		(await DockerLogModel.deleteMany({ "metadata.monitorId": new mongoose.Types.ObjectId(monitorId) })).deletedCount ?? 0;

	deleteByTeamId = async (teamId: string) =>
		(await DockerLogModel.deleteMany({ "metadata.teamId": new mongoose.Types.ObjectId(teamId) })).deletedCount ?? 0;

	deleteByMonitorIdsNotIn = async (monitorIds: string[]) =>
		(await DockerLogModel.deleteMany({ "metadata.monitorId": { $nin: monitorIds.map((id) => new mongoose.Types.ObjectId(id)) } })).deletedCount ?? 0;
}
