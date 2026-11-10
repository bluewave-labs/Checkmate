import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { DateRanges, SortOrders } from "@/types/query.js";
import { incidentSchema, storageIncidentEventSchema } from "@/domain/incidents/incident.schema.js";
import { monitorResponseSchema } from "@/domain/monitors/monitor.schema.js";
import { userResponseSchema } from "@/domain/users/user.schema.js";
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

// A drive page asks for its serial plus the arrays it belongs to
const MAX_STORAGE_SUBJECTS = 20;

export const getStorageIncidentEventsQueryValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
	subjects: z
		.string()
		.transform((value) =>
			value
				.split(",")
				.map((subject) => subject.trim())
				.filter(Boolean)
		)
		.pipe(z.array(z.string()).min(1).max(MAX_STORAGE_SUBJECTS))
		.meta({ description: "Comma-separated drive serials and array devices", example: "WD-WCC7K1PL4R2X,/dev/md1" }),
});

export const storageIncidentEventsResponseSchema = z.array(storageIncidentEventSchema);

export const incidentIdParamValidation = z.object({
	incidentId: z.string().min(1, "Incident ID is required"),
});

export const resolveIncidentBodyValidation = z.object({
	comment: z.string().optional(),
});

export const incidentListResponseSchema = z.object({
	incidents: z.array(incidentSchema),
	count: z.number(),
});

export const incidentDetailResponseSchema = z.object({
	incident: incidentSchema,
	monitor: monitorResponseSchema,
	user: userResponseSchema.or(z.null()),
});
