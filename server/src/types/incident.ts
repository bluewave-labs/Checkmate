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
	comment?: string | null;
	createdAt: string;
	updatedAt: string;
}
