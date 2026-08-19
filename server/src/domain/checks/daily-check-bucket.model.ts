import { Schema, model, type Types } from "mongoose";

interface DailyCheckBucketDocument {
	_id: Types.ObjectId;
	monitorId: Types.ObjectId;
	teamId?: Types.ObjectId;
	timezone: string;
	date: string;
	totalChecks: number;
	upChecks: number;
	downChecks: number;
	avgResponseTime: number | null;
	responseTimeSum: number;
	responseTimeCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const DailyCheckBucketSchema = new Schema<DailyCheckBucketDocument>(
	{
		monitorId: {
			type: Schema.Types.ObjectId,
			ref: "Monitor",
			required: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
		},
		timezone: {
			type: String,
			required: true,
		},
		date: {
			type: String,
			required: true,
		},
		totalChecks: {
			type: Number,
			required: true,
			default: 0,
		},
		upChecks: {
			type: Number,
			required: true,
			default: 0,
		},
		downChecks: {
			type: Number,
			required: true,
			default: 0,
		},
		avgResponseTime: {
			type: Number,
			default: null,
		},
		responseTimeSum: {
			type: Number,
			required: true,
			default: 0,
		},
		responseTimeCount: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{ timestamps: true }
);

DailyCheckBucketSchema.index({ monitorId: 1, timezone: 1, date: 1 }, { unique: true });
DailyCheckBucketSchema.index({ teamId: 1, date: 1 });

const DailyCheckBucketModel = model<DailyCheckBucketDocument>("DailyCheckBucket", DailyCheckBucketSchema);

export type { DailyCheckBucketDocument };
export { DailyCheckBucketModel };
export default DailyCheckBucketModel;
