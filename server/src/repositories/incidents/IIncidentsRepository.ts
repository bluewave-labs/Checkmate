import type { Incident } from "@/types/index.js";
import type { IncidentSummary } from "@/types/index.js";
export interface IIncidentsRepository {
	// create
	create(incident: Partial<Incident>): Promise<Incident>;
	// fetch
	findActiveByIncidentId(incidentId: string, teamId: string): Promise<Incident | null>;
	findActiveByMonitorId(monitorId: string, teamId: string): Promise<Incident | null>;
	findByTeamId(
		teamId: string,
		startDate: Date | undefined,
		page: number,
		rowsPerPage: number,
		sortOrder?: string,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<Incident[]>;
	findSummaryByTeamId(teamId: string, limit?: number): Promise<IncidentSummary>;
	countByTeamId(teamId: string, startDate: Date | undefined, status?: boolean, monitorId?: string, resolutionType?: string): Promise<number>;

	// update
	updateById(incidentId: string, teamId: string, updateData: Partial<Incident>): Promise<Incident>;
	// delete
	// other
}
