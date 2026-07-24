import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { GeoContinents } from "@/domain/geo-checks/geo-check.type.js";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";
import { CheckFilters, DateRanges, SortOrders } from "@/types/query.js";

//****************************************
// Check Validations
//****************************************

export const getChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksQueryValidation = z.object({
	type: z.enum(MonitorTypes).optional(),
	sortOrder: z.enum(SortOrders),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(DateRanges),
	filter: z.enum(CheckFilters).optional(),
	ack: booleanCoercion.optional(),
	page: z.coerce.number(),
	rowsPerPage: z.coerce.number(),
	status: booleanCoercion.optional(),
	continent: z.union([z.enum(GeoContinents), z.array(z.enum(GeoContinents))]).optional(),
});

export const getTeamChecksQueryValidation = z.object({
	sortOrder: z.enum(SortOrders),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(DateRanges),
	filter: z.enum(CheckFilters).optional(),
	ack: booleanCoercion.optional(),
	page: z.coerce.number(),
	rowsPerPage: z.coerce.number(),
});

export const deleteChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksSummaryByTeamIdQueryValidation = z.object({
	dateRange: z.enum(DateRanges).optional(),
});
