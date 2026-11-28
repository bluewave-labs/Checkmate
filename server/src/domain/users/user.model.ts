import { Schema, model, type Types } from "mongoose";
import bcrypt from "bcryptjs";
import { SsoProviders } from "@/domain/sso/sso.type.js";
import { UserRoles, type User, type UserProfileImage } from "@/domain/users/user.type.js";
import { MonitorModel } from "@/domain/monitors/monitor.model.js";
import Team from "../teams/team.model.js";
import NotificationModel from "../notifications/notification.model.js";

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

const ssoLinkSchema = new Schema<NonNullable<User["sso"]>>(
	{
		provider: { type: String, enum: SsoProviders, required: true },
		tenant: { type: String, required: true },
		subject: { type: String, required: true },
		roleManaged: { type: Boolean, default: false },
		lastCheckedAt: { type: String, default: null },
		deactivatedBySso: { type: Boolean, default: false },
	},
	{ _id: false }
);

const UserSchema = new Schema<UserDocument>(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String },
		avatarImage: { type: String },
		profileImage: { type: profileImageSchema },
		isActive: { type: Boolean, default: true },
		isVerified: { type: Boolean, default: false },
		role: {
			type: [String],
			enum: UserRoles,
			default: ["user"],
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		checkTTL: { type: Number },
		sso: { type: ssoLinkSchema },
		tokensValidAfter: { type: Number },
		whatsNewSeen: { type: String },
	},
	{ timestamps: true }
);

UserSchema.index(
	{ "sso.provider": 1, "sso.tenant": 1, "sso.subject": 1 },
	{ unique: true, partialFilterExpression: { "sso.subject": { $exists: true } } }
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
	if (!this.password) return false;
	return bcrypt.compare(submittedPassword, this.password);
};

const UserModel = model<UserDocument>("User", UserSchema);

export type { UserDocument };
export { UserModel };
export default UserModel;
