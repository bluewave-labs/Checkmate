import { z } from "zod";
import { booleanCoercion } from "./shared.js";

//****************************************
// Incident Validations
//****************************************

export const getIncidentsByTeamQueryValidation = z.object({
	sortOrder: z.enum(["asc", "desc"]),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]),
	page: z.coerce.number().int().min(0),
	rowsPerPage: z.coerce.number().int().min(1),
	status: booleanCoercion.optional(),
	monitorId: z.string().optional(),
	resolutionType: z.enum(["manual", "automatic"]).optional(),
	acknowledged: booleanCoercion.optional(),
});

export const getIncidentSummaryQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).optional(),
});

export const acknowledgeIncidentValidation = z.object({
    comment: z.string().max(500).optional(),
});
