import { z } from "zod";
import RE2 from "re2";
import { booleanCoercion, dnsHostnameRegex, dnsServerValidation } from "./shared.js";
import { GeoContinents } from "@/domain/geo-checks/geo-check.type.js";
import {
	DnsRecordTypes,
	HttpMethods,
	HttpStatusCodeSet,
	MonitorMatchMethods,
	MonitorStatuses,
	MonitorTypes,
	PageSpeedStrategies,
	ProxyModes,
} from "@/domain/monitors/monitor.type.js";
import { DateRanges, SortOrders } from "@/types/query.js";
import { DOCKER_LOG_PAGE_DEFAULT, DOCKER_LOG_PAGE_MAX } from "@/domain/docker/docker-log.type.js";
import { isCaptureDockerUrl, isDockerSocketUrl, isDockerTlsUrl } from "@/utils/dockerHost.js";
import { X509Certificate } from "node:crypto";
import { keyMatchesCertificate, parseCertificates, parsePrivateKey } from "@/utils/pem.js";
import { monitorResponseSchema } from "@/domain/monitors/monitor.schema.js";

const httpStatusCode = z.number().refine((code) => HttpStatusCodeSet.has(code), { message: "Must be a valid HTTP status code" });

// The client form submits proxyId: "" when no proxy is selected, set it to undefined
const proxyIdValidation = z
	.string()
	.optional()
	.transform((value) => (value === "" ? undefined : value))
	.refine((value) => value === undefined || /^[0-9a-f]{24}$/i.test(value), { message: "Invalid proxy ID" });

export const getMonitorByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getMonitorByIdQueryValidation = z.object({
	status: booleanCoercion.optional(),
	sortOrder: z.enum(SortOrders).optional(),
	limit: z.coerce.number().optional(),
	dateRange: z.enum(DateRanges).default("recent"),
	numToDisplay: z.coerce.number().optional(),
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
	order: z.enum(SortOrders).optional(),
	type: z.union([z.enum(MonitorTypes), z.array(z.enum(MonitorTypes))]).optional(),
	tags: z.union([z.string(), z.array(z.string())]).optional(),
	explain: booleanCoercion.optional(),
});

export const getDashboardByTeamIdQueryValidation = z.object({
	limit: z.coerce.number().int().min(1).max(100).optional(),
	order: z.enum(SortOrders).optional(),
});

export const getCertificateParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getDomainParamValidation = z.object({
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

// The regex is executed at check time with RE2, reject patterns RE2 won't accept
const refineRegexPattern = (body: { matchMethod?: string; expectedValue?: string }, ctx: z.RefinementCtx) => {
	if (body.matchMethod !== "regex" || !body.expectedValue) return;
	try {
		new RE2(body.expectedValue);
	} catch {
		ctx.addIssue({
			code: "custom",
			path: ["expectedValue"],
			message: "Invalid regex pattern. Backreferences and lookahead/lookbehind are not supported.",
		});
	}
};

const refineHeadMatching = (body: { method?: string; useAdvancedMatching?: boolean; jsonPath?: string }, ctx: z.RefinementCtx) => {
	if (body.method === "HEAD" && (body.useAdvancedMatching === true || (body.jsonPath ?? "") !== "")) {
		ctx.addIssue({
			code: "custom",
			path: ["method"],
			message: "HEAD requests have no response body, so they cannot use advanced matching or a JSON path",
		});
	}
};

const refineProxySelection = (body: { proxyMode?: string; proxyId?: string }, ctx: z.RefinementCtx) => {
	if (body.proxyMode === "custom" && !body.proxyId) {
		ctx.addIssue({
			code: "custom",
			path: ["proxyId"],
			message: "A proxy must be selected when proxy mode is custom",
		});
	}
};

const refineDockerUrl = (data: { type?: string; url?: string }, ctx: z.RefinementCtx) => {
	if (data.type !== "docker" || data.url === undefined) return;
	if (!isDockerSocketUrl(data.url) && !isDockerTlsUrl(data.url) && !isCaptureDockerUrl(data.url)) {
		ctx.addIssue({
			code: "custom",
			path: ["url"],
			message: "Docker host must be a socket path, a TLS daemon URL, or a Capture /metrics/docker endpoint",
		});
	}
};

// Edits are checked in the monitor service against the stored secret, since the body may omit either the url or the secret.
const refineCaptureSecret = (data: { type?: string; url?: string; secret?: string }, ctx: z.RefinementCtx) => {
	if (data.type !== "docker" || !isCaptureDockerUrl(data.url)) return;
	if (!data.secret?.trim()) ctx.addIssue({ code: "custom", path: ["secret"], message: "Capture API secret is required" });
};

type DockerTlsFields = {
	type?: string;
	url?: string;
	ignoreTlsErrors?: boolean;
	dockerTlsCa?: string;
	dockerTlsCert?: string;
	dockerTlsKey?: string;
};

const refineDockerTls = (mode: "create" | "edit") => (data: DockerTlsFields, ctx: z.RefinementCtx) => {
	if (data.type !== "docker" || !isDockerTlsUrl(data.url)) return;
	const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

	if (!data.dockerTlsCert) issue("dockerTlsCert", "TLS certificate is required for a TLS Docker host");

	if (mode === "create" && !data.dockerTlsKey) issue("dockerTlsKey", "TLS key is required for a TLS Docker host");

	if (!data.ignoreTlsErrors && !data.dockerTlsCa) issue("dockerTlsCa", "CA certificate is required unless TLS errors are ignored");

	let certificate: X509Certificate | undefined;

	try {
		if (data.dockerTlsCa) parseCertificates(data.dockerTlsCa);
	} catch (error: unknown) {
		issue("dockerTlsCa", error instanceof Error ? error.message : "Docker TLS CA error");
	}

	try {
		if (data.dockerTlsCert) [certificate] = parseCertificates(data.dockerTlsCert);
	} catch (error) {
		issue("dockerTlsCert", error instanceof Error ? error.message : "Docker TLS cert error");
	}

	try {
		if (data.dockerTlsKey) {
			const key = parsePrivateKey(data.dockerTlsKey);
			if (certificate && !keyMatchesCertificate(key, certificate)) issue("dockerTlsKey", "Key does not match certificate");
		}
	} catch (error: unknown) {
		issue("dockerTlsKey", error instanceof Error ? error.message : "Docker TLS key error");
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
		proxyMode: z.enum(ProxyModes).default("inherit"),
		proxyId: proxyIdValidation,
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
		customUpCodes: z.array(httpStatusCode).default([]),
		secret: z.string().optional(),
		jsonPath: z.union([z.string(), z.literal("")]).optional(),
		expectedValue: z.union([z.string(), z.literal("")]).optional(),
		matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
		method: z.enum(HttpMethods).optional(),
		gameId: z.union([z.string(), z.literal("")]).optional(),
		grpcServiceName: z.union([z.string(), z.literal("")]).default(""),
		strategy: z.enum(PageSpeedStrategies).optional(),
		selectedDisks: z.array(z.string()).optional(),
		group: z.union([z.string().max(50).trim(), z.null(), z.literal("")]).optional(),
		geoCheckEnabled: z.boolean().optional(),
		geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
		geoCheckInterval: z.number().min(300000).optional(),
		dockerLogsEnabled: z.boolean().optional(),
		dockerAlertOnStopped: z.boolean().optional(),
		dockerAlertOnUnhealthy: z.boolean().optional(),
		dockerTlsCa: z.union([z.string(), z.literal("")]).optional(),
		dockerTlsCert: z.union([z.string(), z.literal("")]).optional(),
		dockerTlsKey: z.union([z.string(), z.literal("")]).optional(),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineHeadMatching)
	.superRefine(refineRegexPattern)
	.superRefine(refineProxySelection)
	.superRefine(refineDockerUrl)
	.superRefine(refineCaptureSecret)
	.superRefine(refineDockerTls("create"));

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
		customUpCodes: z.array(httpStatusCode).optional(),
		secret: z.string().optional(),
		ignoreTlsErrors: z.boolean().optional(),
		proxyMode: z.enum(ProxyModes).optional(),
		proxyId: proxyIdValidation,
		useAdvancedMatching: z.boolean().optional(),
		jsonPath: z.union([z.string(), z.literal("")]).optional(),
		expectedValue: z.union([z.string(), z.literal("")]).optional(),
		matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
		method: z.enum(HttpMethods).optional(),
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
		dockerLogsEnabled: z.boolean().optional(),
		dockerAlertOnStopped: z.boolean().optional(),
		dockerAlertOnUnhealthy: z.boolean().optional(),
		dockerTlsCa: z.union([z.string(), z.literal("")]).optional(),
		dockerTlsCert: z.union([z.string(), z.literal("")]).optional(),
		dockerTlsKey: z.union([z.string(), z.literal("")]).optional(),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineHeadMatching)
	.superRefine(refineRegexPattern)
	.superRefine(refineProxySelection)
	.superRefine(refineDockerUrl)
	.superRefine(refineDockerTls("edit"));

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
	dateRange: z.enum(DateRanges),
});

const importedMonitorSchema = z
	.object({
		id: z.string().optional(),
		userId: z.string().optional(),
		teamId: z.string().optional(),
		name: z.string().min(1, "Name is required"),
		description: z.union([z.string(), z.literal("")]).optional(),
		status: z.enum(MonitorStatuses).default("initializing"),
		statusWindow: z.array(z.boolean()).default([]),
		statusWindowSize: z.number().min(1).max(20).default(5),
		statusWindowThreshold: z.number().min(1).max(100).default(60),
		type: z.enum(MonitorTypes, "Invalid monitor type"),
		ignoreTlsErrors: z.boolean().default(false),
		proxyMode: z.enum(ProxyModes).default("inherit"),
		proxyId: proxyIdValidation,
		useAdvancedMatching: z.boolean().default(false),
		jsonPath: z.union([z.string(), z.literal("")]).optional(),
		expectedValue: z.union([z.string(), z.literal("")]).optional(),
		matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
		method: z.enum(HttpMethods).optional().default("GET"),
		url: z.string().min(1, "URL is required"),
		port: z.number().optional(),
		isActive: z.boolean().default(true),
		interval: z.number().default(60000),
		uptimePercentage: z.number().optional(),
		notifications: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		customUpCodes: z.array(httpStatusCode).default([]),
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
		dockerLogsEnabled: z.boolean().default(false),
		dockerAlertOnStopped: z.boolean().default(false),
		dockerAlertOnUnhealthy: z.boolean().default(false),
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineHeadMatching)
	.superRefine(refineRegexPattern)
	.superRefine(refineProxySelection)
	.superRefine(refineDockerUrl)
	.superRefine(refineCaptureSecret);

export const importMonitorsBodyValidation = z.object({
	monitors: z.array(importedMonitorSchema).min(1, "At least one monitor is required"),
});

export type ImportedMonitor = z.output<typeof importedMonitorSchema>;

export const getHardwareDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getHardwareDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(DateRanges).default("recent"),
});

export const getDockerDetailsByIdParamValidation = z.object({ monitorId: z.string().min(1, "Monitor ID is required") });
export const getDockerDetailsByIdQueryValidation = z.object({ dateRange: z.enum(DateRanges).default("recent") });

export const getDockerContainerNameParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
	containerName: z.string().min(1, "Container name is required"),
});
export const getDockerContainerByNameQueryValidation = z.object({ dateRange: z.enum(DateRanges).default("recent") });

const isoToDate = z.iso.datetime().transform((v) => new Date(v));
export const getDockerContainerLogsQueryValidation = z
	.object({
		before: isoToDate.optional(),
		after: isoToDate.optional(),
		limit: z.coerce.number().int().min(1).max(DOCKER_LOG_PAGE_MAX).default(DOCKER_LOG_PAGE_DEFAULT),
	})
	.superRefine((query, ctx) => {
		if (query.before && query.after) {
			ctx.addIssue({
				code: "custom",
				message: "Specify either before or after, not both",
				path: ["after"],
			});
		}
	});

//****************************************
// Response schemas
//****************************************

export const monitorListResponseSchema = z.array(monitorResponseSchema);

export const bulkPauseResponseSchema = z.object({
	monitors: z.array(monitorResponseSchema),
	failedCount: z.number(),
});

export const certificateResponseSchema = z.object({
	certificateDate: z.string(),
});

export const domainResponseSchema = z.object({
	domain: z.string().nullable(),
	expiryDate: z.string().nullable(),
});

export const updateNotificationsResponseSchema = z.object({
	modifiedCount: z.number(),
});

export const demoMonitorsResponseSchema = z.number();

export const importMonitorsResponseSchema = z.object({
	imported: z.number(),
	errors: z.array(z.string()),
});
