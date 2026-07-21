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
