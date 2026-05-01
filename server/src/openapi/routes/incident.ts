import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, okJson, okJsonNoData, standardErrors } from "../helpers.js";
import { getIncidentsByTeamQueryValidation, getIncidentSummaryQueryValidation } from "@/validation/incidentValidation.js";

const tags = ["incidents"];

const incidentIdParam = z.object({ incidentId: z.string() });

const incidentObject = z
	.object({
		id: z.string().openapi({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().openapi({ example: "65f1c2a4d8b9e0123456789a" }),
		teamId: z.string().openapi({ example: "65f1c2a4d8b9e01234567890" }),
		startTime: z.string().openapi({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().openapi({ example: "2026-04-15T03:34:00.000Z" }),
		status: z.boolean().openapi({ example: true, description: "true = resolved, false = ongoing" }),
		message: z.string().nullable().optional().openapi({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().optional().openapi({ example: 503 }),
		resolutionType: z.enum(["automatic", "manual"]).nullable().openapi({ example: "automatic" }),
		resolvedBy: z.string().nullable().optional(),
		resolvedByEmail: z.string().nullable().optional(),
		comment: z.string().nullable().optional(),
		createdAt: z.string().openapi({ example: "2026-04-15T03:21:00.000Z" }),
		updatedAt: z.string().openapi({ example: "2026-04-15T03:34:00.000Z" }),
	})
	.passthrough()
	.openapi("Incident");

const incidentSummaryItem = z
	.object({
		id: z.string().openapi({ example: "65f1c2a4d8b9e0123456789c" }),
		monitorId: z.string().openapi({ example: "65f1c2a4d8b9e0123456789a" }),
		monitorName: z.string().nullable().openapi({ example: "Marketing site" }),
		status: z.boolean().openapi({ example: true }),
		startTime: z.string().openapi({ example: "2026-04-15T03:21:00.000Z" }),
		endTime: z.string().nullable().openapi({ example: "2026-04-15T03:34:00.000Z" }),
		resolutionType: z.enum(["automatic", "manual"]).nullable().openapi({ example: "automatic" }),
		message: z.string().nullable().openapi({ example: "HTTP 503 from origin" }),
		statusCode: z.number().nullable().openapi({ example: 503 }),
		createdAt: z.string().openapi({ example: "2026-04-15T03:21:00.000Z" }),
	})
	.openapi("IncidentSummaryItem");

const incidentSummary = z
	.object({
		total: z.number().openapi({ example: 12 }),
		totalActive: z.number().openapi({ example: 1 }),
		totalManualResolutions: z.number().openapi({ example: 2 }),
		totalAutomaticResolutions: z.number().openapi({ example: 9 }),
		avgResolutionTimeHours: z.number().openapi({ example: 0.5 }),
		topMonitor: z
			.object({
				monitorId: z.string().openapi({ example: "65f1c2a4d8b9e0123456789a" }),
				monitorName: z.string().nullable().openapi({ example: "Marketing site" }),
				incidentCount: z.number().openapi({ example: 4 }),
			})
			.nullable(),
		latestIncidents: z.array(incidentSummaryItem),
	})
	.openapi("IncidentSummary");

registry.registerPath({
	method: "get",
	path: "/incidents/team",
	tags,
	summary: "List incidents for the caller's team",
	security: bearer,
	request: { query: getIncidentsByTeamQueryValidation },
	responses: { "200": okJson(z.array(incidentObject)), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/incidents/team/summary",
	tags,
	summary: "Incident summary for the caller's team",
	security: bearer,
	request: { query: getIncidentSummaryQueryValidation },
	responses: { "200": okJson(incidentSummary), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/incidents/{incidentId}",
	tags,
	summary: "Get an incident by id",
	security: bearer,
	request: { params: incidentIdParam },
	responses: {
		"200": okJson(z.object({ incident: incidentObject, monitor: z.unknown(), user: z.unknown().nullable() })),
		...standardErrors,
	},
});

registry.registerPath({
	method: "put",
	path: "/incidents/{incidentId}/resolve",
	tags,
	summary: "Manually resolve an incident (admin/superadmin)",
	security: bearer,
	request: { params: incidentIdParam },
	responses: { "200": okJsonNoData(), ...standardErrors },
});
