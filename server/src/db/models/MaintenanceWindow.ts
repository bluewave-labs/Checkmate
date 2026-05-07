import { Schema, model, type Types } from "mongoose";
import type { MaintenanceWindow } from "@/types/maintenanceWindow.js";

type MaintenanceWindowDocumentBase = Omit<MaintenanceWindow, "id" | "monitorId" | "teamId" | "start" | "end" | "createdAt" | "updatedAt"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	start: Date;
	end: Date;
	createdAt: Date;
	updatedAt: Date;
};

interface MaintenanceWindowDocument extends MaintenanceWindowDocumentBase {
	_id: Types.ObjectId;
}

const MaintenanceWindowSchema = new Schema<MaintenanceWindowDocument>(
	{
		monitorId: {
			type: Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
		name: {
			type: String,
		},
		duration: {
			type: Number,
		},
		durationUnit: {
			type: String,
			enum: ["seconds", "minutes", "hours", "days"],
		},
		repeat: {
			type: Number,
		},
		start: {
			type: Date,
		},
		end: {
			type: Date,
		},
	},
	{
		timestamps: true,
	}
);

const MaintenanceWindowModel = model<MaintenanceWindowDocument>("MaintenanceWindow", MaintenanceWindowSchema);

export type { MaintenanceWindowDocument };
export { MaintenanceWindowModel };
export default MaintenanceWindowModel;
