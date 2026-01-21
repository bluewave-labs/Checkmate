import { Schema, model, type Types } from "mongoose";

import type { Team } from "@/types/index.js";

type TeamDocumentBase = Omit<Team, "id" | "createdAt" | "updatedAt"> & {};
interface TeamDocument extends TeamDocumentBase {
	_id: Types.ObjectId;
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
	},
	{
		timestamps: true,
	}
);
const TeamModel = model<TeamDocument>("Team", TeamSchema);

export type { TeamDocument };
export { TeamModel };
export default TeamModel;
