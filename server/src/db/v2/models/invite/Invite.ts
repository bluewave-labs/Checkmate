import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvite extends Document {
	_id: Types.ObjectId;
	email: string;
	tokenHash: string;
	roles: Types.ObjectId[];
	createdBy: Types.ObjectId;
	updatedBy: Types.ObjectId;
	expiry: Date;
	createdAt: Date;
	updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role_v2",
				required: true,
			},
		],
		tokenHash: { type: String, required: true, unique: true },
		expiry: {
			type: Date,
			default: Date.now,
			expires: 60 * 60 * 24,
		},
		createdBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
	},
	{ timestamps: true }
);

export const Invite = mongoose.model<IInvite>("Invite_v2", InviteSchema);
