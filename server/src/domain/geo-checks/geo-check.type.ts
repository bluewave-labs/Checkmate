import type { z } from "zod";
import type {
	flatGeoCheckSchema,
	flatGeoChecksQueryResultSchema,
	geoCheckLocationSchema,
	geoCheckMetadataSchema,
	geoCheckResultSchema,
	geoCheckSchema,
	geoCheckTimingsSchema,
	groupedGeoCheckResultSchema,
	groupedGeoCheckSchema,
} from "@/domain/geo-checks/geo-check.schema.js";

export const GeoContinents = ["EU", "NA", "AS", "SA", "AF", "OC"] as const;
export type GeoContinent = (typeof GeoContinents)[number];

export type GeoCheckMetadata = z.infer<typeof geoCheckMetadataSchema>;
export type GeoCheckTimings = z.infer<typeof geoCheckTimingsSchema>;
export type GeoCheckLocation = z.infer<typeof geoCheckLocationSchema>;
export type GeoCheckResult = z.infer<typeof geoCheckResultSchema>;
export type GeoCheck = z.infer<typeof geoCheckSchema>;

export type FlatGeoCheck = z.infer<typeof flatGeoCheckSchema>;
export type FlatGeoChecksQueryResult = z.infer<typeof flatGeoChecksQueryResultSchema>;

export type GroupedGeoCheck = z.infer<typeof groupedGeoCheckSchema>;
export type GroupedGeoCheckResult = z.infer<typeof groupedGeoCheckResultSchema>;
