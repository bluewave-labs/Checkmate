import { z } from "zod";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";
import { GeoContinents } from "./geo-check.type.js";

export const geoCheckMetadataSchema = z.object({
	monitorId: z.string(),
	teamId: z.string(),
	type: z.enum(MonitorTypes),
});

export const geoCheckTimingsSchema = z.object({
	total: z.number(),
	dns: z.number(),
	tcp: z.number(),
	tls: z.number(),
	firstByte: z.number(),
	download: z.number(),
});

export const geoCheckLocationSchema = z.object({
	continent: z.enum(GeoContinents),
	region: z.string(),
	country: z.string(),
	state: z.string(),
	city: z.string(),
	longitude: z.number(),
	latitude: z.number(),
});

export const geoCheckResultSchema = z.object({
	location: geoCheckLocationSchema,
	status: z.boolean(),
	statusCode: z.number(),
	timings: geoCheckTimingsSchema,
});

export const geoCheckSchema = z.object({
	id: z.string(),
	metadata: geoCheckMetadataSchema,
	results: z.array(geoCheckResultSchema),
	expiry: z.string(),
	__v: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const flatGeoCheckSchema = z
	.object({
		id: z.string(),
		monitorId: z.string(),
		teamId: z.string(),
		type: z.enum(MonitorTypes),
		location: geoCheckLocationSchema,
		status: z.boolean(),
		statusCode: z.number(),
		timings: geoCheckTimingsSchema,
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "FlatGeoCheck" });

export const flatGeoChecksQueryResultSchema = z.object({
	geoChecksCount: z.number(),
	geoChecks: z.array(flatGeoCheckSchema),
});

export const groupedGeoCheckSchema = z.object({
	bucketDate: z.string(),
	continent: z.enum(GeoContinents),
	avgResponseTime: z.number(),
	totalChecks: z.number(),
	uptimePercentage: z.number(),
});

export const groupedGeoCheckResultSchema = z.object({
	groupedGeoChecks: z.array(groupedGeoCheckSchema),
});
