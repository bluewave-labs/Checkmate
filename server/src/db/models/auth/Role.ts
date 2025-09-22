import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRole extends Document {
	_id: Types.ObjectId;
	name: string;
	description?: string;
	permissions: string[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 50,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 200,
		},

		permissions: [
			{
				type: String,
				required: true,
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	}
);

roleSchema.index({ name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>("Role", roleSchema);
