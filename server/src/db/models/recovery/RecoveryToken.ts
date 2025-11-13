import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRecoveryToken {
  _id: string;
  userId: Types.ObjectId;
  tokenHash: string;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecoveryTokenSchema = new Schema<IRecoveryToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    tokenHash: { type: String, required: true },
    expiry: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const RecoveryToken = mongoose.model<IRecoveryToken>(
  "RecoveryToken",
  RecoveryTokenSchema
);
