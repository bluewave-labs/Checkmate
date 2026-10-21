import { z } from "zod";
import { IncidentResolutionTypes } from "./incident.type.js";

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
