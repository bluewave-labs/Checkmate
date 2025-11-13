import mongoose, { Schema, Document, Types } from "mongoose";
export interface ITeam extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>("Team", teamSchema);
