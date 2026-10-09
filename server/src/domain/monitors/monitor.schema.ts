import { GeoContinents } from "@/domain/geo-checks/geo-check.type.js";
import {
	DnsRecordTypes,
	HttpMethods,
	MonitorMatchMethods,
	MonitorStatuses,
	MonitorTypes,
	PageSpeedStrategies,
	ProxyModes,
} from "@/domain/monitors/monitor.type.js";
import { z } from "zod";
import {
	checkSnapshotSchema,
	dockerContainerStatsSchema,
	dockerStatsSchema,
	groupedCheckSchema,
	groupedUptimeCheckSchema,
	hardwareStatsSchema,
	pageSpeedGroupedCheckSchema,
} from "@/domain/checks/check.schema.js";
import { monitorStatsSchema } from "@/domain/monitor-stats/monitor-stats.schema.js";

export const monitorSchema = z.object({
	id: z.string(),
	userId: z.string(),
	teamId: z.string(),
	name: z.string(),
	description: z.string().optional(),
	method: z.enum(HttpMethods),
	status: z.enum(MonitorStatuses),
	statusWindow: z.array(z.boolean()),
	statusWindowSize: z.number(),
	statusWindowThreshold: z.number(),
	type: z.enum(MonitorTypes),
	ignoreTlsErrors: z.boolean(),
	proxyMode: z.enum(ProxyModes),
	proxyId: z.string().optional(),
	useAdvancedMatching: z.boolean(),
	jsonPath: z.string().optional(),
	expectedValue: z.string().optional(),
	matchMethod: z.union([z.enum(MonitorMatchMethods), z.literal("")]).optional(),
	url: z.string(),
	port: z.number().optional(),
	isActive: z.boolean(),
	interval: z.number(),
	uptimePercentage: z.number().optional(),
	notifications: z.array(z.string()),
	tags: z.array(z.string()),
	customUpCodes: z.array(z.number()),
	secret: z.string().optional(),
	cpuAlertThreshold: z.number(),
	cpuAlertCounter: z.number(),
	memoryAlertThreshold: z.number(),
	memoryAlertCounter: z.number(),
	diskAlertThreshold: z.number(),
	diskAlertCounter: z.number(),
	tempAlertThreshold: z.number(),
	tempAlertCounter: z.number(),
	selectedDisks: z.array(z.string()),
	gameId: z.string().optional(),
	grpcServiceName: z.string().optional(),
	strategy: z.enum(PageSpeedStrategies).optional(),
	group: z.string().nullable(),
	geoCheckEnabled: z.boolean().optional(),
	geoCheckLocations: z.array(z.enum(GeoContinents)).optional(),
	geoCheckInterval: z.number().optional(),
	dockerLogsEnabled: z.boolean().optional(),
	dockerAlertOnStopped: z.boolean().optional(),
	dockerAlertOnUnhealthy: z.boolean().optional(),
	dockerTlsCa: z.string().optional(),
	dockerTlsCert: z.string().optional(),
	// EncryptionService ciphertext. Never copied by toEntity; omitted from the response schema.
	dockerTlsKey: z.string().optional(),
	dockerTlsKeySet: z.boolean().optional(),
	dnsServer: z.string().optional(),
	dnsRecordType: z.enum(DnsRecordTypes).optional(),
	recentChecks: z.array(checkSnapshotSchema),
	createdAt: z.string(),
	updatedAt: z.string(),
	lastEvaluatedAt: z.number(), // epoch ms
});

const monitorExample = {
	id: "65f1c2a4d8b9e0123456789a",
	name: "Marketing site",
	description: "Production marketing site monitored from the EU region",
	type: "http",
	method: "GET",
	url: "https://www.example.com",
	port: 443,
	isActive: true,
	interval: 60000,
	status: "up",
	statusWindow: [true, true, true, true, true],
	statusWindowSize: 5,
	statusWindowThreshold: 3,
	ignoreTlsErrors: false,
	proxyMode: "inherit",
	useAdvancedMatching: false,
	notifications: ["65f1c2a4d8b9e0123456789b"],
	tags: [],
	customUpCodes: [],
	cpuAlertThreshold: 90,
	cpuAlertCounter: 0,
	memoryAlertThreshold: 90,
	memoryAlertCounter: 0,
	diskAlertThreshold: 90,
	diskAlertCounter: 0,
	tempAlertThreshold: 80,
	tempAlertCounter: 0,
	selectedDisks: [],
	group: null,
	geoCheckEnabled: false,
	geoCheckLocations: [],
	geoCheckInterval: 300000,
	recentChecks: [],
	teamId: "65f1c2a4d8b9e01234567890",
	userId: "65f1c2a4d8b9e01234567891",
	createdAt: "2026-04-01T10:00:00.000Z",
	updatedAt: "2026-04-15T14:30:00.000Z",
	lastEvaluatedAt: 1776254400000,
} satisfies Omit<z.infer<typeof monitorSchema>, "dockerTlsKey">;

export const monitorResponseSchema = monitorSchema.omit({ dockerTlsKey: true }).meta({ id: "Monitor", example: monitorExample });

export const monitorsSummarySchema = z.object({
	totalMonitors: z.number(),
	upMonitors: z.number(),
	downMonitors: z.number(),
	pausedMonitors: z.number(),
	initializingMonitors: z.number(),
	maintenanceMonitors: z.number(),
	breachedMonitors: z.number(),
});

export const monitorsWithChecksByTeamIdResultSchema = z.object({
	summary: monitorsSummarySchema.nullable(),
	count: z.number(),
	monitors: z.array(monitorResponseSchema),
});

export const uptimeDetailsResultSchema = z
	.object({
		monitorData: z.object({
			monitor: monitorResponseSchema,
			groupedChecks: z.array(groupedUptimeCheckSchema),
			groupedUpChecks: z.array(groupedCheckSchema),
			groupedDownChecks: z.array(groupedCheckSchema),
			groupedAvgResponseTime: z.number(),
			groupedUptimePercentage: z.number(),
		}),
		monitorStats: monitorStatsSchema.or(z.null()),
	})
	.meta({ id: "UptimeDetails" });

export const hardwareDetailsResultSchema = z
	.object({
		monitor: monitorResponseSchema,
		stats: hardwareStatsSchema,
		monitorStats: monitorStatsSchema.or(z.null()),
	})
	.meta({ id: "HardwareDetails" });

export const pageSpeedDetailsResultSchema = z
	.object({
		monitorData: z.object({
			monitor: monitorResponseSchema,
			groupedChecks: z.array(pageSpeedGroupedCheckSchema),
		}),
		monitorStats: monitorStatsSchema.or(z.null()),
	})
	.meta({ id: "PageSpeedDetails" });

export const dockerDetailsResultSchema = z
	.object({
		monitor: monitorResponseSchema,
		stats: dockerStatsSchema,
		monitorStats: monitorStatsSchema.or(z.null()),
	})
	.meta({ id: "DockerDetails" });

export const dockerContainerDetailsResultSchema = z
	.object({
		monitor: monitorResponseSchema,
		stats: dockerContainerStatsSchema,
	})
	.meta({ id: "DockerContainerDetails" });

export const gameSchema = z.object({
	name: z.string(),
	release_year: z.number().optional(),
	options: z
		.object({
			port: z.number().optional(),
			port_query: z.number().optional(),
			protocol: z.string().optional(),
		})
		.optional(),
	extra: z
		.object({
			old_id: z.string().optional(),
		})
		.optional(),
});

export const gamesMapSchema = z.record(z.string(), gameSchema);
