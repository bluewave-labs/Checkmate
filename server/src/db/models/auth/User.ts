import mongoose, { Schema, Document, Types } from "mongoose";

import bcrypt from "bcryptjs";
import logger from "../../../utils/logger.js";
import Monitor from "../Monitor.js";
import Team from "../Team.js";
import Notification from "../Notification.js";
import { subscribe } from "diagnostics_channel";

export const RoleTypes = ["user", "admin", "superadmin", "demo"] as const;
export type RoleType = (typeof RoleTypes)[number];

export interface ITokenizedUser {
	sub: string;
	roles: string[];
}

export interface IUser extends Document {
	// V1
	_id: Types.ObjectId;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	avatarImage: string;
	profileImage: {
		data: Buffer;
		contentType: string;
	};
	isActive: boolean;
	isVerified: boolean;
	role?: RoleType[];
	teamId: Types.ObjectId;
	checkTTL: number;
	createdAt: Date;
	updatedAt: Date;
	comparePassword: (submittedPassword: string) => Promise<boolean>;
	// V2
	roles: Types.ObjectId[];
	lastLoginAt?: Date;
	version: number;
}

const UserSchema = new Schema<IUser>(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: false,
		},
		avatarImage: {
			type: String,
		},
		profileImage: {
			data: Buffer,
			contentType: String,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		role: {
			type: [String],
			default: ["user"],
			enum: RoleTypes,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		checkTTL: {
			type: Number,
		},

		// v2
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role",
				default: [],
			},
		],
		lastLoginAt: {
			type: Date,
		},
		version: {
			type: Number,
			default: 1,
		},
	},
	{
		timestamps: true,
	}
);

UserSchema.pre("save", function (next) {
	if (!this.isModified("password")) {
		return next();
	}
	const salt = bcrypt.genSaltSync(10);
	this.password = bcrypt.hashSync(this.password, salt);
	next();
});

UserSchema.pre("findOneAndUpdate", function (next) {
	const update = this.getUpdate();
	if (update && "password" in update) {
		const salt = bcrypt.genSaltSync(10);
		update.password = bcrypt.hashSync(update.password, salt);
	}

	next();
});

UserSchema.pre("findOneAndDelete", async function (next) {
	try {
		const userToDelete = await this.model.findOne(this.getFilter());
		if (!userToDelete) return next();
		if (userToDelete.role.includes("superadmin")) {
			await Team.deleteOne({ _id: userToDelete.teamId });
			await Monitor.deleteMany({ userId: userToDelete._id });
			await this.model.deleteMany({
				teamId: userToDelete.teamId,
				_id: { $ne: userToDelete._id },
			});
			await Notification.deleteMany({ teamId: userToDelete.teamId });
		}
		next();
	} catch (error) {
		next(error as Error);
	}
});

UserSchema.methods.comparePassword = async function (submittedPassword: string) {
	const res = await bcrypt.compare(submittedPassword, this.password);
	return res;
};

export const User = mongoose.model<IUser>("User", UserSchema);
