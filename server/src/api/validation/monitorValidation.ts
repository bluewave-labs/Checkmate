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
import { DockerContainerStates, DockerHealthStatuses, DockerLogStreams, DockerPortProtocols } from "@/domain/docker/docker.type.js";
import { DOCKER_LOG_PAGE_DEFAULT, DOCKER_LOG_PAGE_MAX } from "@/domain/docker/docker-log.type.js";

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
	dateRange: z.enum(DateRanges).optional(),
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

const dockerUrlRegex = /^(?:unix:\/\/\/\S+|\/\S+)$/;

const refineDockerUrl = (data: { type?: string; url?: string }, ctx: z.RefinementCtx) => {
	if (data.type !== "docker" || data.url === undefined) return;
	if (!dockerUrlRegex.test(data.url)) {
		ctx.addIssue({
			code: "custom",
			path: ["url"],
			message: "Docker host must be unix:///path or an absolute socket path",
		});
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
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineHeadMatching)
	.superRefine(refineRegexPattern)
	.superRefine(refineProxySelection)
	.superRefine(refineDockerUrl);

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
		dnsServer: dnsServerValidation.optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
	})
	.superRefine(refineDnsHostname)
	.superRefine(refineStrategyType)
	.superRefine(refineHeadMatching)
	.superRefine(refineRegexPattern)
	.superRefine(refineProxySelection)
	.superRefine(refineDockerUrl);

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
	.superRefine(refineDockerUrl);

export const importMonitorsBodyValidation = z.object({
	monitors: z.array(importedMonitorSchema).min(1, "At least one monitor is required"),
});

export type ImportedMonitor = z.output<typeof importedMonitorSchema>;

export const getHardwareDetailsByIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const getHardwareDetailsByIdQueryValidation = z.object({
	dateRange: z.enum(DateRanges).optional(),
});

export const getDockerDetailsByIdParamValidation = z.object({ monitorId: z.string().min(1, "Monitor ID is required") });
export const getDockerDetailsByIdQueryValidation = z.object({ dateRange: z.enum(DateRanges).optional() });

export const getDockerContainerNameParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
	containerName: z.string().min(1, "Container name is required"),
});
export const getDockerContainerByNameQueryValidation = z.object({ dateRange: z.enum(DateRanges).optional() });

export const getDockerContainerLogsQueryValidation = z
	.object({
		before: z.iso.datetime().optional(),
		after: z.iso.datetime().optional(),
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
		proxyMode: z.enum(ProxyModes),
		proxyId: proxyIdValidation,
		useAdvancedMatching: z.boolean(),
		jsonPath: z.string().optional(),
		expectedValue: z.string().optional(),
		matchMethod: z.enum(MonitorMatchMethods).optional(),
		method: z.enum(HttpMethods),
		notifications: z.array(z.string()),
		tags: z.array(z.string()),
		customUpCodes: z.array(httpStatusCode).optional(),
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
		dockerLogsEnabled: z.boolean(),
		dnsServer: z.string().optional(),
		dnsRecordType: z.enum(DnsRecordTypes).optional(),
		teamId: z.string(),
		userId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
		lastEvaluatedAt: z.number(),
	})
	.passthrough();

// Grouped-check buckets returned by GET /monitors/uptime/details/{monitorId}. Keep
// aligned with GroupedCheck / GroupedUptimeCheck in domain/checks/check.type.ts.
export const groupedCheckResponseSchema = z.object({
	bucketDate: z.string(),
	avgResponseTime: z.number(),
	totalChecks: z.number(),
});

export const groupedUptimeCheckResponseSchema = groupedCheckResponseSchema.extend({
	avgDns: z.number(),
	avgTcp: z.number(),
	avgTls: z.number(),
	avgRequest: z.number(),
	avgFirstByte: z.number(),
	avgDownload: z.number(),
});

// Keep aligned with MonitorStats in domain/monitor-stats/monitor-stats.type.ts.
export const monitorStatsResponseSchema = z.object({
	id: z.string(),
	monitorId: z.string(),
	avgResponseTime: z.number(),
	maxResponseTime: z.number(),
	totalChecks: z.number(),
	totalUpChecks: z.number(),
	totalDownChecks: z.number(),
	uptimePercentage: z.number(),
	lastCheckTimestamp: z.number(),
	lastResponseTime: z.number(),
	timeOfLastFailure: z.number().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// Response of GET /monitors/uptime/details/{monitorId}. Keep aligned with
// UptimeDetailsResult in domain/monitors/monitor.type.ts; the monitor here is the
// repository's domain entity, which serializes `id` rather than `_id`.
export const uptimeDetailsResponseSchema = z.object({
	monitorData: z.object({
		monitor: monitorResponseSchema.omit({ _id: true }).extend({ id: z.string() }),
		groupedChecks: z.array(groupedUptimeCheckResponseSchema),
		groupedUpChecks: z.array(groupedCheckResponseSchema),
		groupedDownChecks: z.array(groupedCheckResponseSchema),
		groupedAvgResponseTime: z.number(),
		groupedUptimePercentage: z.number(),
	}),
	monitorStats: monitorStatsResponseSchema.nullable(),
});

// Keep aligned with DockerContainerPort / DockerContainerMount in types/network.ts.
export const dockerContainerPortResponseSchema = z.object({
	privatePort: z.number(),
	protocol: z.enum(DockerPortProtocols),
	publicPort: z.number().optional(),
	hostIp: z.string().optional(),
});

export const dockerContainerMountResponseSchema = z.object({
	type: z.string(),
	name: z.string().optional(),
	source: z.string(),
	destination: z.string(),
	mode: z.string(),
	rw: z.boolean(),
});

// Keep aligned with DockerContainerInfo / DockerContainerSummary in types/network.ts.
export const dockerContainerResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string(),
	state: z.enum(DockerContainerStates),
	status: z.string(),
	health: z.enum(DockerHealthStatuses),
	cpuPct: z.number().optional(),
	memoryUsedBytes: z.number().optional(),
	memoryLimitBytes: z.number().optional(),
	memoryPct: z.number().optional(),
	restartCount: z.number().optional(),
	startedAt: z.string().optional(),
	ports: z.array(dockerContainerPortResponseSchema).optional(),
	mounts: z.array(dockerContainerMountResponseSchema).optional(),
});

export const containerSummaryResponseSchema = z.object({
	total: z.number(),
	running: z.number(),
	stopped: z.number(),
	unhealthy: z.number(),
});

// Keep aligned with DockerStatsBucket in domain/checks/check.type.ts. The avg fields are
// null for buckets with no values ($avg skips missing; down checks store no containerSummary).
export const dockerStatsBucketResponseSchema = z.object({
	_id: z.string(),
	avgResponseTime: z.number().nullable(),
	upCount: z.number(),
	totalCount: z.number(),
	avgRunning: z.number().nullable(),
	avgTotal: z.number().nullable(),
	avgUnhealthy: z.number().nullable(),
});

// Response of GET /monitors/docker/details/{monitorId}. Keep aligned with
// DockerDetailsResult in domain/monitors/monitor.type.ts; the monitor here is the
// repository's domain entity, which serializes `id` rather than `_id`.
export const dockerDetailsResponseSchema = z.object({
	monitor: monitorResponseSchema.omit({ _id: true }).extend({ id: z.string() }),
	stats: z.object({
		aggregateData: z.object({ totalChecks: z.number() }),
		upChecks: z.object({ totalChecks: z.number() }),
		aggregate: z.array(dockerStatsBucketResponseSchema),
		latest: z
			.object({
				containers: z.array(dockerContainerResponseSchema),
				summary: containerSummaryResponseSchema.optional(),
				checkedAt: z.string(),
			})
			.nullable(),
	}),
	monitorStats: monitorStatsResponseSchema.nullable(),
});

// Keep aligned with DockerContainerStatsBucket in domain/checks/check.type.ts.
export const dockerContainerStatsBucketResponseSchema = z.object({
	_id: z.string(),
	avgCpuPct: z.number().nullable(),
	avgMemoryUsedBytes: z.number().nullable(),
	avgMemoryPct: z.number().nullable(),
	minRestartCount: z.number().nullable(),
	maxRestartCount: z.number().nullable(),
});

// Response of GET /monitors/docker/details/{monitorId}/containers/{containerName}. Keep
// aligned with DockerContainerDetailsResult in domain/monitors/monitor.type.ts.
export const dockerContainerDetailsResponseSchema = z.object({
	monitor: monitorResponseSchema.omit({ _id: true }).extend({ id: z.string() }),
	stats: z.object({
		aggregate: z.array(dockerContainerStatsBucketResponseSchema),
		restartsInRange: z.number(),
		latest: z
			.object({
				container: dockerContainerResponseSchema,
				checkedAt: z.string(),
			})
			.nullable(),
	}),
});

export const dockerLogLineResponseSchema = z.object({
	ts: z.string(),
	stream: z.enum(DockerLogStreams),
	text: z.string(),
});

export const dockerLogResponseSchema = z.object({
	id: z.string(),
	metadata: z.object({ monitorId: z.string(), teamId: z.string(), containerId: z.string(), containerName: z.string() }),
	lines: z.array(dockerLogLineResponseSchema),
	gap: z.boolean(),
	checkedAt: z.string(),
	expiry: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// Response of GET /monitors/docker/details/{monitorId}/containers/{containerName}/logs.
export const dockerContainerLogsResponseSchema = z.object({
	logs: z.array(dockerLogResponseSchema),
	nextCursor: z.string().nullable(),
});
