import joi from "joi";
import { GeoContinents } from "@/types/geoCheck.js";

//****************************************
// Check Validations
//****************************************

export const ackCheckBodyValidation = joi.object({
	ack: joi.boolean(),
});

export const ackAllChecksParamValidation = joi.object({
	monitorId: joi.string().optional(),
	path: joi.string().valid("monitor", "team").required(),
});

export const ackAllChecksBodyValidation = joi.object({
	ack: joi.boolean(),
});

export const getChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const getChecksQueryValidation = joi.object({
	type: joi.string().valid("http", "ping", "pagespeed", "hardware", "docker", "port", "game", "grpc"),
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "up", "down", "resolve"),
	ack: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
	status: joi.boolean(),
	continent: joi.alternatives().try(joi.string().valid(...GeoContinents), joi.array().items(joi.string().valid(...GeoContinents))),
});

export const getTeamChecksQueryValidation = joi.object({
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "up", "down", "resolve"),
	ack: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
});

export const deleteChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const deleteChecksByTeamIdParamValidation = joi.object({});

export const updateChecksTTLBodyValidation = joi.object({
	ttl: joi.number().required(),
});
