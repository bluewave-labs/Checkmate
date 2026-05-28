import { z } from "zod";
import { booleanCoercion, dnsHostnameRegex, dnsServerValidation } from "./shared.js";
import { GeoContinents } from "@/types/geoCheck.js";
import { DnsRecordTypes, MonitorMatchMethods, MonitorStatuses, MonitorTypes, PageSpeedStrategies } from "@/types/monitor.js";
import { ScriptExecutionTargets, SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT, SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP } from "@/types/script.js";

const objectIdLike = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ID format");
const scriptParametersValidation = z.record(z.string(), z.string());
const scriptRegexValidation = z
	.string()
	.refine(
		(value) => {
			if (!value || value.length === 0) return true;
			try {
				new RegExp(value);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Must be a valid regular expression" }
	);

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
	tags: z.union([z.string(), z.array(z.string())]).optional(),
});

export const getMonitorsWithChecksQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	page: z.coerce.number().int().min(0).optional(),
	rowsPerPage: z.coerce.number().int().min(1).max(100).optional(),
	filter: z.union([z.string(), z.literal("")]).optional(),
	field: z.string().optional(),
	order: z.enum(["asc", "desc"]).optional(),
	type: z.union([z.enum(MonitorTypes), z.array(z.enum(MonitorTypes))]).optional(),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	explain: booleanCoercion.optional(),
});

export const getCertificateParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

const refineDnsHostname = (body: { type?: string; url?: string }, ctx: z.RefinementCtx) => {
	if (body.type === "dns" && body.url && !dnsHostnameRegex.test(body.url)) {
		ctx.addIssue({
			code: "custom",
			path: ["url"],
			message: "Enter a valid domain (e.g. www.example.com)",
		});
	}
};

const refineStrategyType = (body: { type?: string; strategy?: string }, ctx: z.RefinementCtx) => {
	if (body.strategy !== undefined && body.type !== undefined && body.type !== "pagespeed") {
		ctx.addIssue({
			code: "custom",
			path: ["strategy"],
			message: "Strategy is only valid for pagespeed monitors",
		});
	}
};

const refineScriptMonitor = (
	body: {
		type?: string;
		scriptId?: string;
		scriptExecutionTarget?: string;
		probeId?: string;
		captureAgentId?: string;
	},
	ctx: z.RefinementCtx
) => {
	if (body.type !== "script") {
		return;
	}
	if (!body.scriptId) {
		ctx.addIssue({ code: "custom", path: ["scriptId"], message: "scriptId is required for script monitors" });
	}
	// Either a captureAgentId, a legacy probeId (with target=probe), or a
	// legacy capture target with the monitor URL acting as the execution
	// endpoint must be present so the script service can resolve a target.
	const hasExecutionTarget =
		Boolean(body.captureAgentId) ||
		Boolean(body.probeId) ||
		body.scriptExecutionTarget === "capture";
	if (!hasExecutionTarget) {
		ctx.addIssue({
			code: "custom",
			path: ["captureAgentId"],
			message: "captureAgentId is required for script monitors (or supply probeId for legacy probe-target monitors)",
		});
	}
	if (body.scriptExecutionTarget === "probe" && !body.probeId) {
		ctx.addIssue({ code: "custom", path: ["probeId"], message: "probeId is required when scriptExecutionTarget is probe" });
	}
};

export const createMonitorBodyValidation = z
	.object({
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
		tags: z.array(z.string()).optional(),
		secret: z.string().optional(),
		jsonPath: z.union([z.string(), z.literal("")]).optional(),
		expectedValue: z.union([z.string(), z.literal("")]).optional(),
		matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
		gameId: z.union([z.string(), z.literal("")]).optional(),
		grpcServiceName: z.union([z.string(), z.literal("")]).default(""),
		strategy: z.enum(PageSpeedStrategies).optional(),
		selectedDisks: z.array(z.string()).optional(),
		group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
		geoCheckEnabled: z.boolean().optional(),
		geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
		geoCheckInterval: z.number().min(300000).optional(),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		scriptId: objectIdLike.optional(),
		scriptExecutionTarget: z.enum(ScriptExecutionTargets).optional(),
		probeId: objectIdLike.optional(),
		captureAgentId: objectIdLike.optional(),
		deviceId: objectIdLike.optional(),
		warningCountsAsDown: z.boolean().optional(),
		scriptExitCodeSuccess: z.number().int().min(0).max(255).default(0),
		scriptOutputMatchRegex: z.union([scriptRegexValidation, z.literal("")]).optional(),
		scriptMaxExecutionTimeMs: z
			.number()
			.int()
			.min(1000)
			.max(SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP)
			.default(SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT),
		scriptParameterOverrides: scriptParametersValidation.optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineScriptMonitor);

export const editMonitorBodyValidation = z
	.object({
		name: z.string().optional(),
		type: z.enum(MonitorTypes).optional(),
		url: z.string().optional(),
		statusWindowSize: z.number().min(1).max(20).default(5),
		statusWindowThreshold: z.number().min(1).max(100).default(60),
		description: z.union([z.string(), z.literal("")]).optional(),
		interval: z.number().optional(),
		notifications: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
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
		strategy: z.enum(PageSpeedStrategies).optional(),
		selectedDisks: z.array(z.string()).optional(),
		group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
		geoCheckEnabled: z.boolean().optional(),
		geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
		geoCheckInterval: z.number().min(300000).optional(),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		scriptId: objectIdLike.optional(),
		scriptExecutionTarget: z.enum(ScriptExecutionTargets).optional(),
		probeId: objectIdLike.optional(),
		captureAgentId: objectIdLike.optional(),
		deviceId: objectIdLike.optional(),
		warningCountsAsDown: z.boolean().optional(),
		scriptExitCodeSuccess: z.number().int().min(0).max(255).optional(),
		scriptOutputMatchRegex: z.union([scriptRegexValidation, z.literal("")]).optional(),
		scriptMaxExecutionTimeMs: z.number().int().min(1000).max(SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP).optional(),
		scriptParameterOverrides: scriptParametersValidation.optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType);

export const pauseMonitorParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const bulkPauseMonitorBodyValidation = z.object({
	monitorIds: z
		.array(z.string().min(1, "Monitor ID must not be empty"))
		.min(1, "At least one monitor ID is required")
		.max(100, "Cannot bulk update more than 100 monitors at once"),
	pause: z.boolean(),
});

export const getUptimeDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getUptimeDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(["recent", "hour", "day", "week", "month", "all"]),
	normalize: booleanCoercion.optional(),
});

const importedMonitorSchema = z
	.object({
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
		tags: z.array(z.string()).default([]),
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
		strategy: z.enum(PageSpeedStrategies).optional(),
		group: z.union([z.string().max(50).trim(), z.null()]).default(null),
		geoCheckEnabled: z.boolean().default(false),
		geoCheckLocations: z.array(z.enum(GeoContinents)).default([]),
		geoCheckInterval: z.number().min(300000).default(300000),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType);

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
		tags: z.array(z.string()),
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
		dnsServer: z.string().optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		teamId: z.string(),
		userId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough();
