import joi from "joi";
import { GeoContinents } from "@/types/geoCheck.js";

export const getMonitorByIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const getMonitorByIdQueryValidation = joi.object({
	status: joi.boolean(),
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
	numToDisplay: joi.number(),
	normalize: joi.boolean(),
	continent: joi.string().valid(...GeoContinents),
});

export const getMonitorsByTeamIdParamValidation = joi.object({});

export const getMonitorsByTeamIdQueryValidation = joi.object({
	type: joi
		.alternatives()
		.try(
			joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc"),
			joi.array().items(joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc"))
		),
	filter: joi.string().allow("", null),
});

export const getMonitorsWithChecksQueryValidation = joi.object({
	limit: joi.number().integer().min(1).max(100).optional(),
	page: joi.number().integer().min(0).optional(),
	rowsPerPage: joi.number().integer().min(1).max(100).optional(),
	filter: joi.string().allow("", null).optional(),
	field: joi.string().optional(),
	order: joi.string().valid("asc", "desc").optional(),
	type: joi
		.alternatives()
		.try(
			joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc"),
			joi.array().items(joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc"))
		)
		.optional(),
	explain: joi.boolean().optional(),
});

export const getCertificateParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const createMonitorBodyValidation = joi.object({
	_id: joi.string(),
	name: joi.string().required(),
	description: joi.string().allow(null, ""),
	type: joi.string().required(),
	statusWindowSize: joi.number().min(1).max(20).default(5),
	statusWindowThreshold: joi.number().min(1).max(100).default(60),
	url: joi.string().required(),
	ignoreTlsErrors: joi.boolean().default(false),
	useAdvancedMatching: joi.boolean().default(false),
	port: joi.number(),
	isActive: joi.boolean(),
	interval: joi.number(),
	cpuAlertThreshold: joi.number(),
	memoryAlertThreshold: joi.number(),
	diskAlertThreshold: joi.number(),
	tempAlertThreshold: joi.number(),
	notifications: joi.array().items(joi.string()),
	secret: joi.string(),
	jsonPath: joi.string().allow(""),
	expectedValue: joi.string().allow(""),
	matchMethod: joi.string().allow(null, ""),
	gameId: joi.string().allow(""),
	grpcServiceName: joi.string().allow("").default(""),
	selectedDisks: joi.array().items(joi.string()).optional(),
	group: joi.string().max(50).trim().allow(null, "").optional(),
	geoCheckEnabled: joi.boolean().optional(),
	geoCheckLocations: joi
		.array()
		.items(joi.string().valid(...GeoContinents))
		.optional(),
	geoCheckInterval: joi.number().min(300000).optional(),
});

export const editMonitorBodyValidation = joi
	.object({
		name: joi.string(),
		statusWindowSize: joi.number().min(1).max(20).default(5),
		statusWindowThreshold: joi.number().min(1).max(100).default(60),
		description: joi.string().allow(null, ""),
		interval: joi.number(),
		notifications: joi.array().items(joi.string()),
		secret: joi.string(),
		ignoreTlsErrors: joi.boolean(),
		useAdvancedMatching: joi.boolean(),
		jsonPath: joi.string().allow(""),
		expectedValue: joi.string().allow(""),
		matchMethod: joi.string().allow(null, ""),
		port: joi.number().min(1).max(65535),
		cpuAlertThreshold: joi.number(),
		memoryAlertThreshold: joi.number(),
		diskAlertThreshold: joi.number(),
		tempAlertThreshold: joi.number(),
		gameId: joi.string().allow(""),
		grpcServiceName: joi.string().allow(""),
		selectedDisks: joi.array().items(joi.string()).optional(),
		group: joi.string().max(50).trim().allow(null, "").optional(),
		geoCheckEnabled: joi.boolean().optional(),
		geoCheckLocations: joi
			.array()
			.items(joi.string().valid(...GeoContinents))
			.optional(),
		geoCheckInterval: joi.number().min(300000).optional(),
	})
	.options({ stripUnknown: true });

export const pauseMonitorParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const getHardwareDetailsByIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const getHardwareDetailsByIdQueryValidation = joi.object({
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
});
