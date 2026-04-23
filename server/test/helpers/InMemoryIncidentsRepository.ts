import type { IIncidentsRepository } from "../../src/repositories/incidents/IIncidentsRepository.ts";
import type { Incident, IncidentSummary } from "../../src/types/index.ts";
import { randomUUID } from "crypto";

export class InMemoryIncidentsRepository implements IIncidentsRepository {
	private incidents: Incident[] = [];

	async create(incident: Partial<Incident>): Promise<Incident> {
		const now = new Date().toISOString();
		const full: Incident = {
			id: randomUUID(),
			monitorId: incident.monitorId ?? "",
			teamId: incident.teamId ?? "",
			startTime: incident.startTime ?? now,
			endTime: incident.endTime ?? null,
			status: incident.status ?? true,
			message: incident.message ?? null,
			statusCode: incident.statusCode ?? null,
			resolutionType: incident.resolutionType ?? null,
			resolvedBy: incident.resolvedBy ?? null,
			resolvedByEmail: incident.resolvedByEmail ?? null,
			comment: incident.comment ?? null,
			createdAt: now,
			updatedAt: now,
		};
		this.incidents.push(full);
		return { ...full };
	}

	async findById(incidentId: string, teamId: string): Promise<Incident> {
		const incident = this.incidents.find((i) => i.id === incidentId && i.teamId === teamId);
		if (!incident) {
			throw new Error(`Incident ${incidentId} not found`);
		}
		return { ...incident };
	}

	async findActiveByIncidentId(incidentId: string, teamId: string): Promise<Incident | null> {
		const incident = this.incidents.find((i) => i.id === incidentId && i.teamId === teamId && i.status === true);
		return incident ? { ...incident } : null;
	}

	async findActiveByMonitorId(monitorId: string, teamId: string): Promise<Incident | null> {
		const incident = this.incidents.find((i) => i.monitorId === monitorId && i.teamId === teamId && i.status === true);
		return incident ? { ...incident } : null;
	}

	async findByTeamId(
		teamId: string,
		startDate: Date | undefined,
		page: number,
		rowsPerPage: number,
		sortOrder?: string,
		status?: boolean,
		monitorId?: string,
		resolutionType?: string
	): Promise<Incident[]> {
		let results = this.incidents.filter((i) => i.teamId === teamId);
		if (startDate) {
			results = results.filter((i) => new Date(i.startTime) >= startDate);
		}
		if (status !== undefined) {
			results = results.filter((i) => i.status === status);
		}
		if (monitorId) {
			results = results.filter((i) => i.monitorId === monitorId);
		}
		if (resolutionType) {
			results = results.filter((i) => i.resolutionType === resolutionType);
		}
		results.sort((a, b) => {
			const cmp = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
			return sortOrder === "desc" ? -cmp : cmp;
		});
		return results.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((i) => ({ ...i }));
	}

	async findSummaryByTeamId(_teamId: string, _limit?: number): Promise<IncidentSummary> {
		throw new Error("Not implemented");
	}

	async countByTeamId(teamId: string, startDate: Date | undefined, status?: boolean, monitorId?: string, resolutionType?: string): Promise<number> {
		let results = this.incidents.filter((i) => i.teamId === teamId);
		if (startDate) {
			results = results.filter((i) => new Date(i.startTime) >= startDate);
		}
		if (status !== undefined) {
			results = results.filter((i) => i.status === status);
		}
		if (monitorId) {
			results = results.filter((i) => i.monitorId === monitorId);
		}
		if (resolutionType) {
			results = results.filter((i) => i.resolutionType === resolutionType);
		}
		return results.length;
	}

	async updateById(incidentId: string, teamId: string, updateData: Partial<Incident>): Promise<Incident> {
		const index = this.incidents.findIndex((i) => i.id === incidentId && i.teamId === teamId);
		if (index === -1) {
			throw new Error(`Incident ${incidentId} not found`);
		}
		const updated: Incident = {
			...this.incidents[index],
			...updateData,
			id: this.incidents[index].id,
			monitorId: this.incidents[index].monitorId,
			teamId: this.incidents[index].teamId,
			createdAt: this.incidents[index].createdAt,
			updatedAt: new Date().toISOString(),
		};
		this.incidents[index] = updated;
		return { ...updated };
	}

	async deleteByMonitorId(monitorId: string, teamId: string): Promise<number> {
		const before = this.incidents.length;
		this.incidents = this.incidents.filter((i) => !(i.monitorId === monitorId && i.teamId === teamId));
		return before - this.incidents.length;
	}

	async deleteByMonitorIdsNotIn(monitorIds: string[]): Promise<number> {
		const before = this.incidents.length;
		this.incidents = this.incidents.filter((i) => monitorIds.includes(i.monitorId));
		return before - this.incidents.length;
	}

	// Test helpers — not part of the interface

	getAll(): Incident[] {
		return this.incidents.map((i) => ({ ...i }));
	}

	clear(): void {
		this.incidents = [];
	}
}
