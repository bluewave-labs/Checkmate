import { z } from "zod";
import { IncidentCauses, IncidentResolutionTypes } from "./incident.type.js";
import { storageBreachSchema } from "@/domain/storage/storage.schema.js";

// A storage alert that opened while the incident was active: the incident's own storage alert, or one that joined an
// incident already open for another reason. Lets a drive's page list the incidents about it.
export const incidentStorageEventSchema = storageBreachSchema
	.extend({
		at: z.string().meta({ example: "2026-11-09T21:14:00.000Z" }),
	})
	.meta({ id: "IncidentStorageEvent" });

export const incidentSchema = z
	.object({
		id: z.string().meta({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
		teamId: z.string().meta({ example: "65f1c2a4d8b9e01234567890" }),
		startTime: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().meta({ example: "2026-04-15T03:34:00.000Z" }),
		status: z.boolean().meta({ example: true, description: "true = resolved, false = ongoing" }),
		message: z.string().nullable().meta({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().meta({ example: 503 }),
		cause: z.enum(IncidentCauses).nullable().meta({
			example: "down",
			description: "What opened the incident: the monitor going down, a hardware threshold, or a storage alert. Null on older incidents",
		}),
		storageEvents: z.array(incidentStorageEventSchema).meta({
			description: "Storage alerts (array or drive) that opened during the incident, oldest first. Empty for other incidents",
		}),
		resolutionType: z.enum(IncidentResolutionTypes).nullable().meta({ example: "automatic" }),
		resolvedBy: z.string().nullable(),
		resolvedByEmail: z.string().nullable(),
		comment: z.string().nullable(),
		createdAt: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		updatedAt: z.string().meta({ example: "2026-04-15T03:34:00.000Z" }),
	})
	.meta({ id: "Incident" });

export const publicIncidentSchema = incidentSchema.pick({
	id: true,
	monitorId: true,
	status: true,
	startTime: true,
	endTime: true,
	resolutionType: true,
	message: true,
	statusCode: true,
	createdAt: true,
});

// One storage event with the state of its incident, for a drive's incident list
export const storageIncidentEventSchema = incidentStorageEventSchema
	.extend({
		incidentId: z.string().meta({ example: "65f1c2a4d8b9e0123456789c" }),
		incidentActive: z.boolean().meta({ example: true }),
		incidentEndTime: z.string().nullable().meta({ example: null }),
	})
	.meta({ id: "StorageIncidentEvent" });

export const incidentSummaryTopMonitorSchema = z.object({
	monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
	monitorName: z.string().nullable().meta({ example: "Marketing site" }),
	incidentCount: z.number().meta({ example: 4 }),
});

export const incidentSummaryItemSchema = z
	.object({
		id: z.string().meta({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
		monitorName: z.string().nullable().meta({ example: "Marketing site" }),
		status: z.boolean().meta({ example: true }),
		startTime: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().meta({ example: "2026-04-15T03:34:00.000Z" }),
		resolutionType: z.enum(IncidentResolutionTypes).nullable().meta({ example: "automatic" }),
		message: z.string().nullable().meta({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().meta({ example: 503 }),
		createdAt: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
	})
	.meta({ id: "IncidentSummaryItem" });

export const incidentSummarySchema = z
	.object({
		total: z.number().meta({ example: 12 }),
		totalActive: z.number().meta({ example: 1 }),
		totalManualResolutions: z.number().meta({ example: 2 }),
		totalAutomaticResolutions: z.number().meta({ example: 9 }),
		avgResolutionTimeHours: z.number().meta({ example: 0.5 }),
		topMonitor: incidentSummaryTopMonitorSchema.nullable(),
		latestIncidents: z.array(incidentSummaryItemSchema),
	})
	.meta({ id: "IncidentSummary" });
