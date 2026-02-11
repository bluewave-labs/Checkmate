import { Schema, model, type Types } from "mongoose";
import bcrypt from "bcryptjs";
import type { User, UserProfileImage, UserRole } from "@/types/index.js";
import { MonitorModel } from "@/db/models/index.js";
import Team from "./Team.js";
import NotificationModel from "./Notification.js";

type UserDocumentBase = Omit<User, "id" | "teamId" | "createdAt" | "updatedAt"> & {
	teamId?: Types.ObjectId;
	profileImage?: Required<UserProfileImage>;
};

interface UserDocument extends UserDocumentBase {
	_id: Types.ObjectId;
	teamId?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const profileImageSchema = new Schema<Required<UserProfileImage>>(
	{
		data: { type: Buffer },
		contentType: { type: String },
	},
	{ _id: false }
);

const UserSchema = new Schema<UserDocument>(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		avatarImage: { type: String },
		profileImage: { type: profileImageSchema },
		isActive: { type: Boolean, default: true },
		isVerified: { type: Boolean, default: false },
		role: {
			type: [String],
			enum: ["user", "admin", "superadmin", "demo" satisfies UserRole],
			default: ["user"],
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		checkTTL: { type: Number },
	},
	{ timestamps: true }
);

UserSchema.pre("findOneAndDelete", async function (next) {
	try {
		const userToDelete = await this.model.findOne(this.getFilter());
		if (!userToDelete) return next();
		if (userToDelete.role.includes("superadmin")) {
			await Team.deleteOne({ _id: userToDelete.teamId });
			await MonitorModel.deleteMany({ userId: userToDelete._id });
			await this.model.deleteMany({ teamId: userToDelete.teamId, _id: { $ne: userToDelete._id } });
			await NotificationModel.deleteMany({ teamId: userToDelete.teamId });
		}
		next();
	} catch (error) {
		next(error as Error);
	}
});

UserSchema.methods.comparePassword = async function (submittedPassword: string) {
	return bcrypt.compare(submittedPassword, this.password);
};

const UserModel = model<UserDocument>("User", UserSchema);

export type { UserDocument };
export { UserModel };
export default UserModel;
