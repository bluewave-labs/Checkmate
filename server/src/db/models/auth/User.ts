import mongoose, { Schema, Document, Types } from "mongoose";
import { IRole, ITeam } from "@/db/models/index.js";

export interface ITokenizedUser {
  sub: string;
  email: string;
  orgId: string;
}
export interface IUserContext {
  sub: string;
  email: string;
  orgId: string;
  teamIds?: string[];
  teams?: ITeam[];
  currentTeamId?: string;
  roles?: {
    orgRole?: IRole;
    teamRole: IRole;
  };
}

export interface IUserReturnable {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  org: {
    name: string;
    permissions: string[];
  };
  teams: {
    id: string;
    name: string;
    permissions: string[];
  }[];
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
