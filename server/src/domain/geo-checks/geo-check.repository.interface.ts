import type { GeoCheck, GeoContinent, GroupedGeoCheck, FlatGeoChecksQueryResult } from "@/domain/geo-checks/geo-check.type.js";
import { DateRange } from "@/types/query.js";

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
	findGroupedByMonitorIdAndDateRange(monitorId: string, DateRange: DateRange, continents?: GeoContinent[]): Promise<GroupedGeoCheck[]>;
	deleteByMonitorId(monitorId: string): Promise<number>;
	deleteByTeamId(teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
}
