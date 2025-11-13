import mongoose, { Schema, Document, Types } from "mongoose";
import { invalidateCachesForUser } from "@/middleware/AddUserContext.js";

export interface IOrgMembership extends Document {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  userId: Types.ObjectId;
  roleId?: Types.ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const orgMembershipSchema = new Schema<IOrgMembership>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
  },
  { timestamps: true }
);

orgMembershipSchema.post<IOrgMembership>("save", async function (doc) {
  invalidateCachesForUser(doc.userId.toString());
});

orgMembershipSchema.post<IOrgMembership>(
  "deleteOne",
  { document: true, query: false },
  async function (doc) {
    invalidateCachesForUser(doc.userId.toString());
  }
);

orgMembershipSchema.post("findOneAndDelete", function (doc: IOrgMembership) {
  if (!doc) return;
  invalidateCachesForUser(doc.userId.toString());
});

orgMembershipSchema.post(
  "findOneAndUpdate",
  async function (doc: IOrgMembership) {
    if (!doc) return;
    invalidateCachesForUser(doc.userId.toString());
  }
);

export const OrgMembership = mongoose.model<IOrgMembership>(
  "OrgMembership",
  orgMembershipSchema
);
