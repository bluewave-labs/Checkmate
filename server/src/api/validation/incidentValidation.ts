import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { DateRanges, SortOrders } from "@/types/query.js";
import { IncidentResolutionTypes } from "@/domain/incidents/incident.type.js";

//****************************************
// Incident Validations
//****************************************

export const getIncidentsByTeamQueryValidation = z.object({
	sortOrder: z.enum(SortOrders),
	dateRange: z.enum(DateRanges).default("all"),
	page: z.coerce.number().int().min(0),
	rowsPerPage: z.coerce.number().int().min(1),
	status: booleanCoercion.optional(),
	monitorId: z.string().optional(),
	resolutionType: z.enum(IncidentResolutionTypes).optional(),
});

export const getIncidentSummaryQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).optional(),
});

export const incidentIdParamValidation = z.object({
	incidentId: z.string().min(1, "Incident ID is required"),
});

export const resolveIncidentBodyValidation = z.object({
	comment: z.string().optional(),
});

export const incidentResponseSchema = z
	.object({
		id: z.string().meta({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
		teamId: z.string().meta({ example: "65f1c2a4d8b9e01234567890" }),
		startTime: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().meta({ example: "2026-04-15T03:34:00.000Z" }),
		status: z.boolean().meta({ example: true, description: "true = resolved, false = ongoing" }),
		message: z.string().nullable().optional().meta({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().optional().meta({ example: 503 }),
		resolutionType: z.enum(["automatic", "manual"]).nullable().meta({ example: "automatic" }),
		resolvedBy: z.string().nullable().optional(),
		resolvedByEmail: z.string().nullable().optional(),
		comment: z.string().nullable().optional(),
		createdAt: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		updatedAt: z.string().meta({ example: "2026-04-15T03:34:00.000Z" }),
	})
	.passthrough()
	.meta({ id: "Incident" });

export const incidentListResponseSchema = z.array(incidentResponseSchema);

export const incidentDetailResponseSchema = z.object({
	incident: incidentResponseSchema,
	monitor: z.unknown(),
	user: z.unknown().nullable(),
});

export const incidentSummaryItemResponseSchema = z
	.object({
		id: z.string().meta({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
		monitorName: z.string().nullable().meta({ example: "Marketing site" }),
		status: z.boolean().meta({ example: true }),
		startTime: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().meta({ example: "2026-04-15T03:34:00.000Z" }),
		resolutionType: z.enum(["automatic", "manual"]).nullable().meta({ example: "automatic" }),
		message: z.string().nullable().meta({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().meta({ example: 503 }),
		createdAt: z.string().meta({ example: "2026-04-15T03:21:00.000Z" }),
	})
	.meta({ id: "IncidentSummaryItem" });

export const incidentSummaryResponseSchema = z
	.object({
		total: z.number().meta({ example: 12 }),
		totalActive: z.number().meta({ example: 1 }),
		totalManualResolutions: z.number().meta({ example: 2 }),
		totalAutomaticResolutions: z.number().meta({ example: 9 }),
		avgResolutionTimeHours: z.number().meta({ example: 0.5 }),
		topMonitor: z
			.object({
				monitorId: z.string().meta({ example: "65f1c2a4d8b9e0123456789a" }),
				monitorName: z.string().nullable().meta({ example: "Marketing site" }),
				incidentCount: z.number().meta({ example: 4 }),
			})
			.nullable(),
		latestIncidents: z.array(incidentSummaryItemResponseSchema),
	})
	.meta({ id: "IncidentSummary" });
