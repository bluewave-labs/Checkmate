import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { GeoContinents } from "@/types/geoCheck.js";

//****************************************
// Check Validations
//****************************************

export const getChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksQueryValidation = z.object({
	type: z.enum(["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "grpc", "websocket", "dns"]).optional(),
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
