import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { GeoContinents } from "@/domain/geo-checks/geo-check.type.js";
import { MonitorTypes } from "@/domain/monitors/monitor.types.js";

//****************************************
// Check Validations
//****************************************

export const getChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksQueryValidation = z.object({
	type: z.enum(MonitorTypes).optional(),
	sortOrder: z.enum(["asc", "desc"]),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]),
	filter: z.enum(["all", "up", "down", "resolve"]).optional(),
	ack: booleanCoercion.optional(),
	page: z.coerce.number(),
	rowsPerPage: z.coerce.number(),
	status: booleanCoercion.optional(),
	continent: z.union([z.enum(GeoContinents), z.array(z.enum(GeoContinents))]).optional(),
});

// getChecksFlexibleQueryValidation backs GET /api/v1/checks. It accepts an
// optional monitorId query param and uses sensible defaults so that
// script-monitor detail pages can fetch the latest N checks without
// constructing a full pagination payload.
export const getChecksFlexibleQueryValidation = z.object({
	monitorId: z.string().min(1).optional(),
	type: z.enum(MonitorTypes).optional(),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).default("all"),
	filter: z.enum(["all", "up", "down", "resolve"]).optional(),
	limit: z.coerce.number().int().min(1).max(500).optional(),
	page: z.coerce.number().int().min(0).default(0),
	rowsPerPage: z.coerce.number().int().min(1).max(500).default(50),
	status: booleanCoercion.optional(),
});

export const getTeamChecksQueryValidation = z.object({
	sortOrder: z.enum(["asc", "desc"]),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]),
	filter: z.enum(["all", "up", "down", "resolve"]).optional(),
	ack: booleanCoercion.optional(),
	page: z.coerce.number(),
	rowsPerPage: z.coerce.number(),
});

export const deleteChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksSummaryByTeamIdQueryValidation = z.object({
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
});
