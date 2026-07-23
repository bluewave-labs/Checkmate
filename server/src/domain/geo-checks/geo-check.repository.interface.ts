import type { GeoCheck, GroupedGeoCheck } from "@/domain/geo-checks/geo-check.type.js";
import type { GeoContinent, FlatGeoCheck } from "@/domain/geo-checks/geo-check.type.js";
import { DateRange } from "@/types/query.js";

export interface GeoChecksQueryResult {
	geoChecksCount: number;
	geoChecks: GeoCheck[];
}

export interface FlatGeoChecksQueryResult {
	geoChecksCount: number;
	geoChecks: FlatGeoCheck[];
}

export interface IGeoChecksRepository {
	createGeoChecks(geoChecks: Omit<GeoCheck, "id" | "__v" | "createdAt" | "updatedAt">[]): Promise<GeoCheck[]>;
	findByMonitorId(
		monitorId: string,
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		continents?: GeoContinent[]
	): Promise<FlatGeoChecksQueryResult>;
	findByMonitorIdAndDateRange(monitorId: string, startDate: Date, endDate: Date): Promise<GeoCheck[]>;
	findGroupedByMonitorIdAndDateRange(monitorId: string, DateRange: DateRange, continents?: GeoContinent[]): Promise<GroupedGeoCheck[]>;
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
}
