import { z } from "zod";
import { GeoContinents } from "@/types/geoCheck.js";

//****************************************
// Check Validations
//****************************************

export const getChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getChecksQueryValidation = z.object({
	type: z.enum(["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "grpc"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	limit: z.number().optional(),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
	filter: z.enum(["all", "up", "down", "resolve"]).optional(),
	ack: z.boolean().optional(),
	page: z.number().optional(),
	rowsPerPage: z.number().optional(),
	status: z.boolean().optional(),
	continent: z.union([z.enum(GeoContinents), z.array(z.enum(GeoContinents))]).optional(),
});

export const getTeamChecksQueryValidation = z.object({
	sortOrder: z.enum(["asc", "desc"]).optional(),
	limit: z.number().optional(),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
	filter: z.enum(["all", "up", "down", "resolve"]).optional(),
	ack: z.boolean().optional(),
	page: z.number().optional(),
	rowsPerPage: z.number().optional(),
});

export const deleteChecksParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const deleteChecksByTeamIdParamValidation = z.object({});

export const updateChecksTTLBodyValidation = z.object({
	ttl: z.number().min(1, "TTL is required"),
});
