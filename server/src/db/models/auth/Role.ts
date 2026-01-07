import mongoose, { Schema, Document, Types } from "mongoose";

export const ScopeTypes = ["organization", "team"] as const;
export type ScopeType = (typeof ScopeTypes)[number];

type IdLike = string | Types.ObjectId;

export type RoleLike = {
  _id: IdLike;
  organizationId: IdLike;
  name: string;
  scope: ScopeType;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export interface IRole extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  scope: ScopeType;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    name: { type: String, required: true },
    scope: { type: String, enum: ScopeTypes, required: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>("Role", roleSchema);
