export interface Incident {
	id: string;
	monitorId: string;
	teamId: string;
	startTime: string;
	endTime: string | null;
	status: boolean;
	message?: string | null;
	statusCode?: number | null;
	resolutionType: "automatic" | "manual" | null;
	resolvedBy?: string | null;
	resolvedByEmail?: string | null;
	comment?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface IncidentsResponse {
	incidents: Incident[];
	count: number;
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
	resolutionType: "automatic" | "manual" | null;
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

export const StorageAlertReasons = [
	"array_degraded",
	"array_inactive",
	"drive_failed",
	"drive_warning",
] as const;
export type StorageAlertReason = (typeof StorageAlertReasons)[number];

// A storage alert logged on one of a hardware monitor's incidents, for a drive's incident list
export interface StorageIncidentEvent {
	subject: string;
	reason: StorageAlertReason;
	detail: string;
	device?: string;
	model?: string;
	at: string;
	incidentId: string;
	incidentActive: boolean;
	incidentEndTime: string | null;
}
