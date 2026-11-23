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

// What opened the incident. Null on incidents from before this field.
export const IncidentCauses = ["down", "threshold", "storage"] as const;
export type IncidentCause = (typeof IncidentCauses)[number];

export type Incident = z.infer<typeof incidentSchema>;
export type PublicIncident = z.infer<typeof publicIncidentSchema>;
export type IncidentSummaryTopMonitor = z.infer<typeof incidentSummaryTopMonitorSchema>;
export type IncidentSummaryItem = z.infer<typeof incidentSummaryItemSchema>;
export type IncidentSummary = z.infer<typeof incidentSummarySchema>;
