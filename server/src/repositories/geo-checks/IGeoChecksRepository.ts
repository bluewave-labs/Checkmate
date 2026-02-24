import type { GeoCheck, GroupedGeoCheck } from "@/types/geoCheck.js";
import type { GeoContinent } from "@/types/geoCheck.js";

export interface IGeoChecksRepository {
	createGeoChecks(geoChecks: Omit<GeoCheck, "id" | "__v" | "createdAt" | "updatedAt">[]): Promise<GeoCheck[]>;
	findByMonitorIdAndDateRange(monitorId: string, startDate: Date, endDate: Date): Promise<GeoCheck[]>;
	findGroupedByMonitorIdAndDateRange(
		monitorId: string,
		startDate: Date,
		endDate: Date,
		dateFormat: string,
		continent?: GeoContinent
	): Promise<GroupedGeoCheck[]>;
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
}
