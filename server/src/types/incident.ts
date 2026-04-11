// export type IncidentResolutionType = "automatic" | "manual" | null;

export const IncidentResolutionTypes = ["automatic", "manual", null] as const;
export type IncidentResolutionType = (typeof IncidentResolutionTypes)[number];

export interface Incident {
	id: string;
	monitorId: string;
	teamId: string;
	startTime: string;
	endTime: string | null;
	status: boolean;
	message?: string | null;
	statusCode?: number | null;
	resolutionType: IncidentResolutionType;
	resolvedBy?: string | null;
	resolvedByEmail?: string | null;
	comment?: string | null;
	severity?: "none" | "high" | "critical" | null;
	createdAt: string;
	updatedAt: string;
}

export interface IncidentSummaryTopMonitor {
	monitorId: string;
	monitorName: string | null;
	incidentCount: number;
}

export interface IncidentSummaryItem {
	id: string;
	monitorId: string;
	monitorName: string | null;
	status: boolean;
	startTime: string;
	endTime: string | null;
	resolutionType: IncidentResolutionType;
	message: string | null;
	statusCode: number | null;
	createdAt: string;
}

export interface IncidentSummary {
	total: number;
	totalActive: number;
	totalManualResolutions: number;
	totalAutomaticResolutions: number;
	avgResolutionTimeHours: number;
	topMonitor: IncidentSummaryTopMonitor | null;
	latestIncidents: IncidentSummaryItem[];
}
