import type { Monitor, MonitorType } from "@/Types/Monitor";
export type MonitorDisplayType = "uptime" | "infrastructure";

export const MONITOR_TYPE_KEYS: Partial<Record<MonitorType, string>> = {
	http: "pages.common.monitors.monitorTypes.optionHttp",
	ping: "pages.common.monitors.monitorTypes.optionPing",
	docker: "pages.common.monitors.monitorTypes.optionDocker",
	port: "pages.common.monitors.monitorTypes.optionPort",
	game: "pages.common.monitors.monitorTypes.optionGame",
	grpc: "pages.common.monitors.monitorTypes.optionGrpc",
	websocket: "pages.common.monitors.monitorTypes.optionWebSocket",
	dns: "pages.common.monitors.monitorTypes.optionDns",
	hardware: "pages.common.monitors.monitorTypes.optionHardware",
	pagespeed: "pages.common.monitors.monitorTypes.optionPagespeed",
};

export const getMonitorTypeLabel = (
	type: MonitorType,
	t: (key: string) => string
): string => {
	const key = MONITOR_TYPE_KEYS[type];
	return key ? t(key) : type;
};

export const STATUS_PAGE_THEMES = ["refined", "modern", "bold", "editorial"] as const;
export type StatusPageTheme = (typeof STATUS_PAGE_THEMES)[number];
export const DEFAULT_STATUS_PAGE_THEME: StatusPageTheme = "refined";

export const STATUS_PAGE_THEME_MODES = ["auto", "light", "dark"] as const;
export type StatusPageThemeMode = (typeof STATUS_PAGE_THEME_MODES)[number];
export const DEFAULT_STATUS_PAGE_THEME_MODE: StatusPageThemeMode = "auto";

export const resolveStatusPageTheme = (
	value: string | null | undefined
): StatusPageTheme =>
	STATUS_PAGE_THEMES.find((t) => t === value) ?? DEFAULT_STATUS_PAGE_THEME;

export const resolveStatusPageThemeMode = (
	value: string | null | undefined
): StatusPageThemeMode =>
	STATUS_PAGE_THEME_MODES.find((m) => m === value) ?? DEFAULT_STATUS_PAGE_THEME_MODE;
export const PUBLIC_STATUS_PAGE_PREFIX = "/status/public";

export interface StatusPage {
	id: string;
	userId: string;
	teamId: string;
	type: MonitorDisplayType[];
	companyName: string;
	url: string;
	timezone?: string;
	color: string;
	monitors: string[];
	subMonitors: string[];
	originalMonitors?: string[];
	logo?: {
		data: string;
		contentType: string;
	} | null;
	isPublished: boolean;
	showCharts: boolean;
	showUptimePercentage: boolean;
	showAdminLoginLink: boolean;
	showInfrastructure: boolean;
	customCSS: string;
	theme: StatusPageTheme;
	themeMode: StatusPageThemeMode;
	createdAt: string;
	updatedAt: string;
}

export interface StatusPageResponse {
	statusPage: StatusPage;
	monitors: Monitor[];
}
