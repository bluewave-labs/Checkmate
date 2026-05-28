import { Schema, model, Types } from "mongoose";
import type { Script } from "@/types/script.js";
import { ScriptRuntimes } from "@/types/script.js";

type ScriptDocumentBase = Omit<Script, "id" | "teamId" | "createdBy" | "createdAt" | "updatedAt"> & {
	teamId: Types.ObjectId;
	createdBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
};

export interface ScriptDocument extends ScriptDocumentBase {
	_id: Types.ObjectId;
}

const ScriptSchema = new Schema<ScriptDocument>(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			required: true,
			immutable: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			maxLength: 128,
		},
		description: {
			type: String,
			default: "",
		},
		runtime: {
			type: String,
			required: true,
			enum: ScriptRuntimes,
		},
		bodyHash: {
			type: String,
			required: true,
		},
		encryptedBody: {
			type: String,
			required: true,
		},
		parameters: {
			type: Schema.Types.Mixed,
			default: {},
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			immutable: true,
		},
	},
	{ timestamps: true }
);

ScriptSchema.index({ teamId: 1 });
ScriptSchema.index({ teamId: 1, name: 1 }, { unique: true });

const ScriptModel = model<ScriptDocument>("Script", ScriptSchema);

export { ScriptModel };
export default ScriptModel;
