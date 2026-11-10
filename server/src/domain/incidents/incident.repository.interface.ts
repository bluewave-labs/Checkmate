import type { Incident } from "@/domain/incidents/incident.type.js";
import type { IncidentStorageEvent, IncidentSummary, StorageIncidentEvent } from "@/domain/incidents/incident.type.js";
export interface IIncidentsRepository {
	// create
	create(incident: Partial<Incident>): Promise<Incident>;
	// fetch
	findById(incidentId: string, teamId: string): Promise<Incident>;
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
	findByMonitorIdAndDate(monitorId: string, teamId: string, dateStart: Date, dateEnd: Date): Promise<Incident[]>;
	findSummaryByTeamId(teamId: string, limit?: number): Promise<IncidentSummary>;
	// Storage events for the given subjects (drive serials, array devices) across the monitor's incidents, newest first
	findStorageEvents(monitorId: string, teamId: string, subjects: string[], limit: number): Promise<StorageIncidentEvent[]>;
	countByTeamId(teamId: string, startDate: Date | undefined, status?: boolean, monitorId?: string, resolutionType?: string): Promise<number>;

	// update
	updateById(incidentId: string, teamId: string, updateData: Partial<Incident>): Promise<Incident>;
	appendStorageEvents(incidentId: string, teamId: string, events: IncidentStorageEvent[]): Promise<Incident>;
	// delete
	deleteByMonitorId(monitorId: string, teamId: string): Promise<number>;
	deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number>;
	// other
}
