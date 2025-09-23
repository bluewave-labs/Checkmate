import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInvite extends Document {
	// v1
	_id: Types.ObjectId;
	email: string;
	teamId: Types.ObjectId;
	role: string[];
	token: string;
	expiry: Date;
	createdAt: Date;
	updatedAt: Date;

	// v2
	tokenHash: string;
	roles: Types.ObjectId[];
	createdBy: Types.ObjectId;
	updatedBy: Types.ObjectId;
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
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		role: {
			type: [String],
			required: true,
			default: ["user"],
		},
		token: {
			type: String,
			required: true,
		},
		expiry: {
			type: Date,
			default: Date.now,
			expires: 3600,
		},

		// v2
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role",
				required: true,
			},
		],
		tokenHash: { type: String, required: true, unique: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
	},
	{
		timestamps: true,
	}
);

export const Invite = mongoose.model<IInvite>("Invite", InviteSchema);
