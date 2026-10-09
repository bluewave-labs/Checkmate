import type { z } from "zod";
import type {
	incidentSchema,
	incidentSummaryItemSchema,
	incidentSummarySchema,
	incidentSummaryTopMonitorSchema,
	publicIncidentSchema,
} from "@/domain/incidents/incident.schema.js";

export const IncidentResolutionTypes = ["automatic", "manual"] as const;
export type IncidentResolutionType = (typeof IncidentResolutionTypes)[number] | null;

export type Incident = z.infer<typeof incidentSchema>;
export type PublicIncident = z.infer<typeof publicIncidentSchema>;
export type IncidentSummaryTopMonitor = z.infer<typeof incidentSummaryTopMonitorSchema>;
export type IncidentSummaryItem = z.infer<typeof incidentSummaryItemSchema>;
export type IncidentSummary = z.infer<typeof incidentSummarySchema>;
