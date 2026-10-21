export type { CheckSnapshot } from "@/domain/checks/check.type.js";
export type { GeoContinent, GroupedGeoCheckResult } from "@/domain/geo-checks/geo-check.type.js";
import http from "node:http";
import { DockerLogPage } from "@/domain/docker/docker-log.type.js";
import { isDockerSocketUrl } from "@/utils/dockerHost.js";

import type { z } from "zod";
import type {
	dockerContainerDetailsResultSchema,
	dockerDetailsResultSchema,
	gameSchema,
	gamesMapSchema,
	hardwareDetailsResultSchema,
	monitorSchema,
	monitorsSummarySchema,
	monitorsWithChecksByTeamIdResultSchema,
	pageSpeedDetailsResultSchema,
	uptimeDetailsResultSchema,
} from "@/domain/monitors/monitor.schema.js";

export const HttpStatusCodes = [
	...Object.keys(http.STATUS_CODES).map(Number),
	419, // Page Expired (Laravel)
	420, // Enhance Your Calm (Twitter)
	440, // Login Time-out (IIS)
	449, // Retry With (IIS)
	460, // Client Closed Connection (AWS ELB)
	463, // X-Forwarded-For Too Large (AWS ELB)
	497, // HTTP Request Sent to HTTPS Port (NGINX)
	499, // Client Closed Request (NGINX)
	509, // Bandwidth Limit Exceeded (Apache)
	520, // Web Server Returned an Unknown Error (Cloudflare)
	521, // Web Server Is Down (Cloudflare)
	522, // Connection Timed Out (Cloudflare)
	523, // Origin Is Unreachable (Cloudflare)
	524, // A Timeout Occurred (Cloudflare)
	525, // SSL Handshake Failed (Cloudflare)
	526, // Invalid SSL Certificate (Cloudflare)
	527, // Railgun Error (Cloudflare)
	529, // Site is overloaded
	530, // Site is frozen (Cloudflare)
	561, // Unauthorized (AWS ELB)
];
export const HttpStatusCodeSet = new Set(HttpStatusCodes);
export type HttpStatusCode = number;

export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game", "grpc", "websocket", "dns", "unknown"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export const PageSpeedStrategies = ["desktop", "mobile"] as const;
export type PageSpeedStrategy = (typeof PageSpeedStrategies)[number];
export const DefaultPageSpeedStrategy: PageSpeedStrategy = "desktop";

export const GeoCheckSupportedTypes: readonly MonitorType[] = ["http", "ping"] as const;
export const supportsGeoCheck = (type: MonitorType): boolean => GeoCheckSupportedTypes.includes(type);

export const ProxyModes = ["inherit", "none", "custom"] as const;
export type ProxyMode = (typeof ProxyModes)[number];

export const UptimeDetailsSupportedTypes = ["http", "ping", "port", "game", "grpc", "websocket", "dns"] as const satisfies readonly MonitorType[];
export type UptimeDetailsSupportedType = (typeof UptimeDetailsSupportedTypes)[number];
export const supportsUptimeDetails = (type: MonitorType): type is UptimeDetailsSupportedType => UptimeDetailsSupportedTypes.some((t) => t === type);

export const HardwareMetricKeys = ["cpu", "memory", "disk", "temp"] as const;
export type HardwareMetricKey = (typeof HardwareMetricKeys)[number];
export type HardwareBreaches = Record<HardwareMetricKey, boolean>;
export type HardwareCounters = Record<HardwareMetricKey, number>;

const MonitorPaths: Record<MonitorType, string> = {
	http: "uptime",
	port: "uptime",
	ping: "uptime",
	game: "uptime",
	grpc: "uptime",
	websocket: "uptime",
	dns: "uptime",
	unknown: "uptime",
	docker: "docker/host",
	hardware: "infrastructure",
	pagespeed: "pagespeed",
};

export const getMonitorPath = (type: MonitorType): string => MonitorPaths[type];

// Types whose check leaves the instance, and whose failure to reach the target can therefore be the instance's
// own loss of egress. A hardware check is an ordinary outbound HTTP request to the Capture agent, so it counts
// however far away the agent is. `unknown` is excluded because no request is made for it.
export const EgressAttributableTypes = [
	"http",
	"ping",
	"pagespeed",
	"hardware",
	"docker",
	"port",
	"game",
	"grpc",
	"websocket",
	"dns",
] as const satisfies readonly MonitorType[];
export type EgressAttributableType = (typeof EgressAttributableTypes)[number];

// A Docker daemon reached over a unix socket (`unix:///path` or a bare absolute path) is local IPC and cannot
// fail through egress; one reached over TCP or TLS is as remote as any other target. The URL, not the type, settles it.
const isLocalDockerSocket = (monitor: Pick<Monitor, "type" | "url">): boolean => monitor.type === "docker" && isDockerSocketUrl(monitor.url);

export const isEgressAttributable = (monitor: Pick<Monitor, "type" | "url">): boolean =>
	EgressAttributableTypes.some((t) => t === monitor.type) && !isLocalDockerSocket(monitor);

export const MonitorStatuses = ["up", "down", "paused", "initializing", "maintenance", "breached"] as const;
export type MonitorStatus = (typeof MonitorStatuses)[number];

export const MonitorMatchMethods = ["equal", "include", "regex"] as const;
export type MonitorMatchMethod = (typeof MonitorMatchMethods)[number] | "";

export const DnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
export type DnsRecordType = (typeof DnsRecordTypes)[number];

export const HttpMethods = ["GET", "HEAD"] as const;
export type HttpMethod = (typeof HttpMethods)[number];

export const MAX_RECENT_CHECKS = 50;

export type Monitor = z.infer<typeof monitorSchema>;
export type MonitorsSummary = z.infer<typeof monitorsSummarySchema>;
export type MonitorsWithChecksByTeamIdResult = z.infer<typeof monitorsWithChecksByTeamIdResultSchema>;
export type UptimeDetailsResult = z.infer<typeof uptimeDetailsResultSchema>;
export type HardwareDetailsResult = z.infer<typeof hardwareDetailsResultSchema>;
export type DockerDetailsResult = z.infer<typeof dockerDetailsResultSchema>;
export type DockerContainerDetailsResult = z.infer<typeof dockerContainerDetailsResultSchema>;
export type PageSpeedDetailsResult = z.infer<typeof pageSpeedDetailsResultSchema>;
export type Game = z.infer<typeof gameSchema>;
export type GamesMap = z.infer<typeof gamesMapSchema>;

export type MonitorScheduleFields = Pick<Monitor, "id" | "type" | "isActive" | "interval" | "geoCheckEnabled" | "geoCheckInterval">;
export type DockerContainerLogsResult = DockerLogPage;
