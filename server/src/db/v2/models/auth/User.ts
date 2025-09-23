import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITokenizedUser {
	sub: string;
	roles: string[];
}
export interface IUser extends Document {
	_id: Types.ObjectId;
	email: string;
	firstName: string;
	lastName: string;
	passwordHash: string;
	roles: Types.ObjectId[];
	profile: {
		avatar?: string;
		bio?: string;
		timezone: string;
		locale: string;
	};
	preferences: {
		theme: "light" | "dark" | "system";
	};
	lastLoginAt?: Date;
	isActive: boolean;
	isVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
			maxlength: 50,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
			maxlength: 50,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role_v2",
			},
		],
		profile: {
			avatar: {
				type: String,
			},
			bio: {
				type: String,
				maxlength: 200,
			},
			timezone: {
				type: String,
				default: "UTC",
			},
			locale: {
				type: String,
				default: "en",
			},
		},
		preferences: {
			theme: {
				type: String,
				enum: ["light", "dark", "system"],
				default: "system",
			},
		},
		lastLoginAt: {
			type: Date,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: function (_doc, ret) {
				delete ret.passwordHash;
				return ret;
			},
		},
	}
);

export const User = mongoose.model<IUser>("User_v2", userSchema);
