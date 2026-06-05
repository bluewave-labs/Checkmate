import { Schema, model, type Types } from "mongoose";
import type { Tag as TagEntity } from "@/types/index.js";

type TagDocumentBase = Omit<TagEntity, "id" | "teamId" | "createdAt" | "updatedAt">;

interface TagDocument extends TagDocumentBase {
	_id: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const TagSchema = new Schema<TagDocument>(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		name: { type: String, required: true },
		color: { type: String, required: true, default: "#13715B" },
	},
	{ timestamps: true }
);

TagSchema.index({ teamId: 1, name: 1 }, { unique: true });

const TagModel = model<TagDocument>("Tag", TagSchema);

export type { TagDocument };
export { TagModel };
export default TagModel;
