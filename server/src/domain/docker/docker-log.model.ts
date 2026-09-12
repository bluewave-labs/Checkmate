import { Schema, model, Types } from "mongoose";
import { DockerLogStreams, type DockerLogLine } from "@/domain/docker/docker.type.js";
import type { DockerLog, DockerLogMetadata } from "@/domain/docker/docker-log.type.js";

type DockerLogMetadataDocument = Omit<DockerLogMetadata, "monitorId" | "teamId"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
};

type DockerLogDocumentBase = Omit<DockerLog, "id" | "metadata" | "checkedAt" | "expiry" | "createdAt" | "updatedAt"> & {
	metadata: DockerLogMetadataDocument;
	checkedAt: Date;
	expiry: Date;
	createdAt: Date;
	updatedAt: Date;
};

export interface DockerLogDocument extends DockerLogDocumentBase {
	_id: Types.ObjectId;
}

const dockerLogMetadataSchema = new Schema<DockerLogMetadataDocument>(
	{
		monitorId: { type: Schema.Types.ObjectId, required: true },
		teamId: { type: Schema.Types.ObjectId, required: true },
		containerId: { type: String, required: true },
		containerName: { type: String, required: true },
	},
	{ _id: false }
);

const dockerLogLineSchema = new Schema<DockerLogLine>(
	{
		ts: { type: String, required: true },
		stream: { type: String, enum: DockerLogStreams, required: true },
		text: { type: String, default: "" },
	},
	{ _id: false }
);

const DockerLogSchema = new Schema<DockerLogDocument>(
	{
		metadata: { type: dockerLogMetadataSchema, required: true },
		lines: { type: [dockerLogLineSchema], required: true, default: [] },
		gap: { type: Boolean, default: false },
		checkedAt: { type: Date, required: true },
		expiry: { type: Date, required: true, index: { expires: 0 } }, // TTL: Mongo deletes the doc once `expiry` passes
	},
	{ timestamps: true }
);

DockerLogSchema.index({ "metadata.monitorId": 1, "metadata.containerName": 1, checkedAt: -1 }); // API paging
DockerLogSchema.index({ "metadata.monitorId": 1, "metadata.containerId": 1, checkedAt: -1 }); // cursor seed
DockerLogSchema.index({ "metadata.teamId": 1 });

const DockerLogModel = model<DockerLogDocument>("DockerLog", DockerLogSchema);

export type { DockerLogMetadataDocument };
export { DockerLogModel };
export default DockerLogModel;
