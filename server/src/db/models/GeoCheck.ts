import { Schema, model, Types } from "mongoose";
import { MonitorTypes, type MonitorType } from "@/types/monitor.js";
import type { GeoCheck, GeoCheckLocation, GeoCheckMetadata, GeoCheckResult, GeoCheckTimings } from "@/types/geoCheck.js";

type GeoCheckMetadataDocument = Omit<GeoCheckMetadata, "monitorId" | "teamId"> & {
	monitorId: Types.ObjectId;
	teamId: Types.ObjectId;
	type: MonitorType;
};

type GeoCheckDocumentBase = Omit<GeoCheck, "id" | "metadata" | "expiry" | "createdAt" | "updatedAt" | "results"> & {
	metadata: GeoCheckMetadataDocument;
	results: GeoCheckResult[];
	expiry: Date;
	createdAt: Date;
	updatedAt: Date;
	__v: number;
};

export interface GeoCheckDocument extends GeoCheckDocumentBase {
	_id: Types.ObjectId;
}

const geoCheckMetadataSchema = new Schema<GeoCheckMetadataDocument>(
	{
		monitorId: { type: Schema.Types.ObjectId, required: true, index: true },
		teamId: { type: Schema.Types.ObjectId, required: true, index: true },
		type: { type: String, required: true, enum: MonitorTypes },
	},
	{ _id: false }
);

const geoCheckTimingsSchema = new Schema<GeoCheckTimings>(
	{
		total: { type: Number, default: 0 },
		dns: { type: Number, default: 0 },
		tcp: { type: Number, default: 0 },
		tls: { type: Number, default: 0 },
		firstByte: { type: Number, default: 0 },
		download: { type: Number, default: 0 },
	},
	{ _id: false }
);

const geoCheckLocationSchema = new Schema<GeoCheckLocation>(
	{
		continent: { type: String, required: true },
		region: { type: String, default: "" },
		country: { type: String, default: "" },
		state: { type: String, default: "" },
		city: { type: String, default: "" },
		longitude: { type: Number, default: 0 },
		latitude: { type: Number, default: 0 },
	},
	{ _id: false }
);

const geoCheckResultSchema = new Schema<GeoCheckResult>(
	{
		location: {
			type: geoCheckLocationSchema,
			required: true,
		},
		status: {
			type: Boolean,
			required: true,
		},
		statusCode: {
			type: Number,
			required: true,
		},
		timings: {
			type: geoCheckTimingsSchema,
			required: true,
		},
	},
	{ _id: false }
);

const GeoCheckSchema = new Schema<GeoCheckDocument>(
	{
		metadata: {
			type: geoCheckMetadataSchema,
			required: true,
		},
		results: {
			type: [geoCheckResultSchema],
			required: true,
			default: [],
		},
		expiry: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		strict: false,
		timeseries: {
			timeField: "createdAt",
			metaField: "metadata",
			granularity: "seconds",
		},
	}
);

GeoCheckSchema.index({ "metadata.monitorId": 1, createdAt: -1 });
GeoCheckSchema.index({ "metadata.monitorId": 1, createdAt: 1 });
GeoCheckSchema.index({ "metadata.monitorId": 1, "results.location.continent": 1, createdAt: -1 });
GeoCheckSchema.index({ "metadata.teamId": 1, createdAt: -1 });
GeoCheckSchema.index({ "metadata.teamId": 1, "results.status": 1, createdAt: -1 });
GeoCheckSchema.index({ createdAt: 1 });

const GeoCheckModel = model<GeoCheckDocument>("GeoCheck", GeoCheckSchema);

export type { GeoCheckMetadataDocument };
export { GeoCheckModel };
export default GeoCheckModel;
