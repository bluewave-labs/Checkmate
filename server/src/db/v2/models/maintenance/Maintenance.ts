import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMaintenance extends Document {
	_id: Types.ObjectId;
	name: string;
	isActive: boolean;
	monitors: Types.ObjectId[];
	startTime: Date;
	endTime: Date;
	createdBy: Types.ObjectId;
	updatedBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
	{
		name: { type: String, required: true, trim: true },
		isActive: { type: Boolean, required: true, default: true },
		monitors: [
			{
				type: Schema.Types.ObjectId,
				ref: "Monitor_v2",
				required: true,
			},
		],
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User_v2", required: true },
	},
	{ timestamps: true }
);

MaintenanceSchema.index({ isActive: 1 });
MaintenanceSchema.index({ startTime: 1 });
MaintenanceSchema.index({ endTime: 1 });

export const Maintenance = mongoose.model<IMaintenance>("Maintenance_v2", MaintenanceSchema);
