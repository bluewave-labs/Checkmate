import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { GeoContinents } from "@/types/geoCheck.js";
import { MonitorMatchMethods, MonitorTypes } from "@/types/monitor.js";

export const getMonitorByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getMonitorByIdQueryValidation = z.object({
	status: booleanCoercion.optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
	numToDisplay: z.coerce.number().optional(),
	normalize: booleanCoercion.optional(),
	continent: z.enum(GeoContinents).optional(),
});

export const getMonitorsByTeamIdParamValidation = z.object({});

export const getMonitorsByTeamIdQueryValidation = z.object({
	type: z
		.union([
			z.enum(["http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc", "websocket"]),
			z.array(z.enum(["http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc", "websocket"])),
		])
		.optional(),
	filter: z.union([z.string(), z.literal("")]).optional(),
});

export const getMonitorsWithChecksQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	page: z.coerce.number().int().min(0).optional(),
	rowsPerPage: z.coerce.number().int().min(1).max(100).optional(),
	filter: z.union([z.string(), z.literal("")]).optional(),
	field: z.string().optional(),
	order: z.enum(["asc", "desc"]).optional(),
	type: z
		.union([
			z.enum(["http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc", "websocket"]),
			z.array(z.enum(["http", "ping", "pagespeed", "docker", "hardware", "port", "game", "grpc", "websocket"])),
		])
		.optional(),
	explain: booleanCoercion.optional(),
});

export const getCertificateParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const createMonitorBodyValidation = z.object({
	_id: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.union([z.string(), z.literal("")]).optional(),
	type: z.enum(MonitorTypes, "Invalid monitor type"),
	statusWindowSize: z.number().min(1).max(20).default(5),
	statusWindowThreshold: z.number().min(1).max(100).default(60),
	url: z.string().min(1, "URL is required"),
	ignoreTlsErrors: z.boolean().default(false),
	useAdvancedMatching: z.boolean().default(false),
	port: z.number().optional(),
	isActive: z.boolean().optional(),
	interval: z.number().optional(),
	cpuAlertThreshold: z.number().optional(),
	memoryAlertThreshold: z.number().optional(),
	diskAlertThreshold: z.number().optional(),
	tempAlertThreshold: z.number().optional(),
	notifications: z.array(z.string()).optional(),
	secret: z.string().optional(),
	jsonPath: z.union([z.string(), z.literal("")]).optional(),
	expectedValue: z.union([z.string(), z.literal("")]).optional(),
	matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
	gameId: z.union([z.string(), z.literal("")]).optional(),
	grpcServiceName: z.union([z.string(), z.literal("")]).default(""),
	selectedDisks: z.array(z.string()).optional(),
	group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
	geoCheckEnabled: z.boolean().optional(),
	geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
	geoCheckInterval: z.number().min(300000).optional(),
});

export const editMonitorBodyValidation = z.object({
	name: z.string().optional(),
	type: z.enum(MonitorTypes).optional(),
	url: z.string().optional(),
	statusWindowSize: z.number().min(1).max(20).default(5),
	statusWindowThreshold: z.number().min(1).max(100).default(60),
	description: z.union([z.string(), z.literal("")]).optional(),
	interval: z.number().optional(),
	notifications: z.array(z.string()).optional(),
	secret: z.string().optional(),
	ignoreTlsErrors: z.boolean().optional(),
	useAdvancedMatching: z.boolean().optional(),
	jsonPath: z.union([z.string(), z.literal("")]).optional(),
	expectedValue: z.union([z.string(), z.literal("")]).optional(),
	matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
	port: z.number().min(1).max(65535).optional(),
	cpuAlertThreshold: z.number().optional(),
	memoryAlertThreshold: z.number().optional(),
	diskAlertThreshold: z.number().optional(),
	tempAlertThreshold: z.number().optional(),
	gameId: z.union([z.string(), z.literal("")]).optional(),
	grpcServiceName: z.union([z.string(), z.literal("")]).optional(),
	selectedDisks: z.array(z.string()).optional(),
	group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
	geoCheckEnabled: z.boolean().optional(),
	geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
	geoCheckInterval: z.number().min(300000).optional(),
});

export const sendTestEmailBodyValidation = z.object({
	to: z.string().email("Invalid 'to' email address"),
});

export const pauseMonitorParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getUptimeDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getUptimeDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]),
	normalize: booleanCoercion.optional(),
});

const importedMonitorSchema = z.object({
	id: z.string().optional(),
	userId: z.string().optional(),
	teamId: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.union([z.string(), z.literal("")]).optional(),
	status: z.enum(["up", "down", "paused", "initializing", "maintenance", "breached"]).optional(),
	statusWindow: z.array(z.boolean()).optional(),
	statusWindowSize: z.number().optional(),
	statusWindowThreshold: z.number().optional(),
	type: z.enum(MonitorTypes, "Invalid monitor type"),
	ignoreTlsErrors: z.boolean().optional(),
	useAdvancedMatching: z.boolean().optional(),
	jsonPath: z.union([z.string(), z.literal("")]).optional(),
	expectedValue: z.union([z.string(), z.literal("")]).optional(),
	matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
	url: z.string().min(1, "URL is required"),
	port: z.number().optional(),
	isActive: z.boolean().optional(),
	interval: z.number().optional(),
	uptimePercentage: z.number().optional(),
	notifications: z.array(z.string()).optional(),
	secret: z.string().optional(),
	cpuAlertThreshold: z.number().optional(),
	cpuAlertCounter: z.number().optional(),
	memoryAlertThreshold: z.number().optional(),
	memoryAlertCounter: z.number().optional(),
	diskAlertThreshold: z.number().optional(),
	diskAlertCounter: z.number().optional(),
	tempAlertThreshold: z.number().optional(),
	tempAlertCounter: z.number().optional(),
	selectedDisks: z.array(z.string()).optional(),
	gameId: z.union([z.string(), z.literal("")]).optional(),
	grpcServiceName: z.union([z.string(), z.literal("")]).optional(),
	group: z.union([z.string(), z.null()]).optional(),
	geoCheckEnabled: z.boolean().optional(),
	geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
	geoCheckInterval: z.number().optional(),
	recentChecks: z.array(z.unknown()).optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export const importMonitorsBodyValidation = z.object({
	monitors: z.array(importedMonitorSchema).min(1, "At least one monitor is required"),
});

export const getHardwareDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getHardwareDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
});
