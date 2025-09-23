import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMigration extends Document {
	_id: Types.ObjectId;
	name: string;
	runAt: Date;
	success: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const migrationSchema = new Schema<IMigration>(
	{
		name: {
			type: String,
			required: true,
		},
		runAt: {
			type: Date,
			required: false,
		},
		success: {
			type: Boolean,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

migrationSchema.index({ name: 1 }, { unique: true });

export const Migration = mongoose.model<IMigration>("Migration", migrationSchema);
