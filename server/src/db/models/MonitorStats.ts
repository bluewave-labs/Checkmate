import { Schema, model, type Types } from "mongoose";
import type { MonitorStats as MonitorStatsEntity } from "@/types/monitorStats.js";

type MonitorStatsDocumentBase = Omit<MonitorStatsEntity, "id" | "monitorId" | "createdAt" | "updatedAt"> & {
	monitorId: Types.ObjectId;
};

interface MonitorStatsDocument extends MonitorStatsDocumentBase {
	_id: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const MonitorStatsSchema = new Schema<MonitorStatsDocument>(
	{
		monitorId: {
			type: Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
			index: true,
			required: true,
		},
		avgResponseTime: {
			type: Number,
			default: 0,
		},
		maxResponseTime: {
			type: Number,
			default: 0,
		},
		totalChecks: {
			type: Number,
			default: 0,
		},
		totalUpChecks: {
			type: Number,
			default: 0,
		},
		totalDownChecks: {
			type: Number,
			default: 0,
		},
		uptimePercentage: {
			type: Number,
			default: 0,
		},
		lastCheckTimestamp: {
			type: Number,
			default: 0,
		},
		lastResponseTime: {
			type: Number,
			default: 0,
		},
		timeOfLastFailure: {
			type: Number,
			default: undefined,
		},
	},
	{ timestamps: true }
);

const MonitorStatsModel = model<MonitorStatsDocument>("MonitorStats", MonitorStatsSchema);

export type { MonitorStatsDocument };
export { MonitorStatsModel };
export default MonitorStatsModel;
