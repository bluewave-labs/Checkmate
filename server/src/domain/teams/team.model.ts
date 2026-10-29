import { Schema, model, type Types } from "mongoose";

import type { Team } from "@/domain/teams/team.type.js";

type TeamDocumentBase = Omit<Team, "id" | "heartbeatKeyCreatedBy" | "createdAt" | "updatedAt"> & {};
interface TeamDocument extends TeamDocumentBase {
	_id: Types.ObjectId;
	heartbeatKeyCreatedBy?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const TeamSchema = new Schema<TeamDocument>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		heartbeatKeyHash: {
			type: String,
			select: false,
		},
		heartbeatKeyCreatedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	}
);

TeamSchema.index(
	{ heartbeatKeyHash: 1 },
	{
		unique: true,
		partialFilterExpression: { heartbeatKeyHash: { $type: "string" } },
	}
);

const TeamModel = model<TeamDocument>("Team", TeamSchema);

export type { TeamDocument };
export { TeamModel };
export default TeamModel;
