import type { Incident } from "@/types/index.js";
export interface IIncidentsRepository {
	// create
	create(incident: Partial<Incident>): Promise<Incident>;
	// fetch
	findActiveByIncidentId(incidentId: string, teamId: string): Promise<Incident | null>;
	findActiveByMonitorId(monitorId: string, teamId: string): Promise<Incident | null>;
	findByTeamId(
		teamId: string,
		dateRange: string,
		page: number,
		rowsPerPage: number,
		sortOrder?: string,
		status?: string,
		monitorId?: string,
		resolutionType?: string
	): Promise<Incident[]>;

	// update
	updateById(incidentId: string, teamId: string, updateData: Partial<Incident>): Promise<Incident>;
	// delete
}
