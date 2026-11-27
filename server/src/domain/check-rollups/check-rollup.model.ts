import { Schema, model, type Types } from "mongoose";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";
import type { CheckRollup, CheckRollupHardware, CheckRollupSumCount, CheckRollupUptime } from "@/domain/check-rollups/check-rollup.type.js";

type CheckRollupDocumentBase = Omit<CheckRollup, "id" | "monitorId" | "teamId" | "bucketStart" | "updatedAt"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	bucketStart: Date;
	updatedAt: Date;
};

interface CheckRollupDocument extends CheckRollupDocumentBase {
	_id: Types.ObjectId;
}

const uptimeSchema = new Schema<CheckRollupUptime>(
	{
		dnsSum: { type: Number, default: 0 },
		tcpSum: { type: Number, default: 0 },
		tlsSum: { type: Number, default: 0 },
		requestSum: { type: Number, default: 0 },
		firstByteSum: { type: Number, default: 0 },
		downloadSum: { type: Number, default: 0 },
	},
	{ _id: false }
);

const sumCountSchema = new Schema<CheckRollupSumCount>(
	{
		sum: { type: Number, default: 0 },
		count: { type: Number, default: 0 },
	},
	{ _id: false }
);

const hardwareSchema = new Schema<CheckRollupHardware>(
	{
		cpuUsage: { type: sumCountSchema, required: true },
		cpuCurrentFrequency: { type: sumCountSchema, required: true },
		memoryUsedBytes: { type: sumCountSchema, required: true },
		memoryAvailableBytes: { type: sumCountSchema, required: true },
		memoryUsage: { type: sumCountSchema, required: true },
		temperature: { type: [sumCountSchema], default: [] },
	},
	{ _id: false }
);

const CheckRollupSchema = new Schema<CheckRollupDocument>({
	monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true, immutable: true },
	teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, immutable: true },
	type: { type: String, enum: MonitorTypes, required: true },
	bucketStart: { type: Date, required: true, immutable: true },
	totalChecks: { type: Number, default: 0 },
	upChecks: { type: Number, default: 0 },
	downChecks: { type: Number, default: 0 },
	degradedChecks: { type: Number, default: 0 },
	responseTimeSum: { type: Number, default: 0 },
	responseTimeCount: { type: Number, default: 0 },
	upResponseTimeSum: { type: Number, default: 0 },
	upResponseTimeCount: { type: Number, default: 0 },
	downResponseTimeSum: { type: Number, default: 0 },
	downResponseTimeCount: { type: Number, default: 0 },
	uptime: { type: uptimeSchema, default: undefined },
	hardware: { type: hardwareSchema, default: undefined },
	updatedAt: { type: Date, required: true },
});

CheckRollupSchema.index({ monitorId: 1, bucketStart: 1 }, { unique: true });
CheckRollupSchema.index({ teamId: 1, bucketStart: 1 });
CheckRollupSchema.index({ bucketStart: 1 });

const CheckRollupModel = model<CheckRollupDocument>("CheckRollup", CheckRollupSchema);

export type { CheckRollupDocument };
export { CheckRollupModel };
export default CheckRollupModel;
