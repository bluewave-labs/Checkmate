import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { GeoContinents } from "@/types/geoCheck.js";
import { MonitorMatchMethods, MonitorStatuses, MonitorTypes } from "@/types/monitor.js";

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
	continent: z.union([z.enum(GeoContinents), z.array(z.enum(GeoContinents))]).optional(),
});

export const getMonitorsByTeamIdParamValidation = z.object({});

export const getMonitorsByTeamIdQueryValidation = z.object({
	type: z.union([z.enum(MonitorTypes), z.array(z.enum(MonitorTypes))]).optional(),
	filter: z.union([z.string(), z.literal("")]).optional(),
});

export const getMonitorsWithChecksQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	page: z.coerce.number().int().min(0).optional(),
	rowsPerPage: z.coerce.number().int().min(1).max(100).optional(),
	filter: z.union([z.string(), z.literal("")]).optional(),
	field: z.string().optional(),
	order: z.enum(["asc", "desc"]).optional(),
	type: z.union([z.enum(MonitorTypes), z.array(z.enum(MonitorTypes))]).optional(),
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
	dnsServer: z.union([z.string(), z.literal("")]).optional(),
	dnsRecordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]).default("A"),
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
	dnsServer: z.union([z.string(), z.literal("")]).optional(),
	dnsRecordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]).optional(),
	selectedDisks: z.array(z.string()).optional(),
	group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
	geoCheckEnabled: z.boolean().optional(),
	geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
	geoCheckInterval: z.number().min(300000).optional(),
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
	status: z.enum(["up", "down", "paused", "initializing", "maintenance", "breached"]).default("initializing"),
	statusWindow: z.array(z.boolean()).default([]),
	statusWindowSize: z.number().min(1).max(20).default(5),
	statusWindowThreshold: z.number().min(1).max(100).default(60),
	type: z.enum(MonitorTypes, "Invalid monitor type"),
	ignoreTlsErrors: z.boolean().default(false),
	useAdvancedMatching: z.boolean().default(false),
	jsonPath: z.union([z.string(), z.literal("")]).optional(),
	expectedValue: z.union([z.string(), z.literal("")]).optional(),
	matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
	url: z.string().min(1, "URL is required"),
	port: z.number().optional(),
	isActive: z.boolean().default(true),
	interval: z.number().default(60000),
	uptimePercentage: z.number().optional(),
	notifications: z.array(z.string()).default([]),
	secret: z.string().optional(),
	cpuAlertThreshold: z.number().default(100),
	cpuAlertCounter: z.number().default(5),
	memoryAlertThreshold: z.number().default(100),
	memoryAlertCounter: z.number().default(5),
	diskAlertThreshold: z.number().default(100),
	diskAlertCounter: z.number().default(5),
	tempAlertThreshold: z.number().default(100),
	tempAlertCounter: z.number().default(5),
	selectedDisks: z.array(z.string()).default([]),
	gameId: z.union([z.string(), z.literal("")]).optional(),
	grpcServiceName: z.union([z.string(), z.literal("")]).default(""),
	dnsServer: z.union([z.string(), z.literal("")]).optional(),
	dnsRecordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]).default("A"),
	group: z.union([z.string().max(50).trim(), z.null()]).default(null),
	geoCheckEnabled: z.boolean().default(false),
	geoCheckLocations: z.array(z.enum(GeoContinents)).default([]),
	geoCheckInterval: z.number().min(300000).default(300000),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export const importMonitorsBodyValidation = z.object({
	monitors: z.array(importedMonitorSchema).min(1, "At least one monitor is required"),
});

export type ImportedMonitor = z.output<typeof importedMonitorSchema>;

export const getHardwareDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getHardwareDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]).optional(),
});

// Canonical monitor shape returned by /monitors endpoints. Keep aligned with
// what the controllers actually serialize.
export const monitorResponseSchema = z
	.object({
		_id: z.string(),
		name: z.string(),
		description: z.string().optional(),
		type: z.enum(MonitorTypes),
		url: z.string(),
		port: z.number().optional(),
		isActive: z.boolean(),
		interval: z.number(),
		status: z.enum(MonitorStatuses),
		statusWindowSize: z.number(),
		statusWindowThreshold: z.number(),
		ignoreTlsErrors: z.boolean(),
		useAdvancedMatching: z.boolean(),
		jsonPath: z.string().optional(),
		expectedValue: z.string().optional(),
		matchMethod: z.enum(MonitorMatchMethods).optional(),
		notifications: z.array(z.string()),
		secret: z.string().optional(),
		cpuAlertThreshold: z.number(),
		memoryAlertThreshold: z.number(),
		diskAlertThreshold: z.number(),
		tempAlertThreshold: z.number(),
		selectedDisks: z.array(z.string()),
		gameId: z.string().optional(),
		grpcServiceName: z.string().optional(),
		group: z.string().nullable().optional(),
		geoCheckEnabled: z.boolean(),
		geoCheckLocations: z.array(z.enum(GeoContinents)),
		geoCheckInterval: z.number(),
		teamId: z.string(),
		userId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough();
