import { monitorTypeLabelKey } from "@/Types/Monitor";
import type { Monitor, MonitorType } from "@/Types/Monitor";
export type MonitorDisplayType = "uptime" | "infrastructure";

export const getMonitorTypeLabel = (
	type: MonitorType,
	t: (key: string) => string
): string => {
	const fragment = monitorTypeLabelKey[type];
	return fragment ? t(`pages.common.monitors.monitorTypes.${fragment}`) : type;
};

export const STATUS_PAGE_THEMES = [
	"refined",
	"modern",
	"bold",
	"editorial",
	"minimal",
] as const;
export type StatusPageTheme = (typeof STATUS_PAGE_THEMES)[number];
export const DEFAULT_STATUS_PAGE_THEME: StatusPageTheme = "refined";

export const STATUS_PAGE_THEME_MODES = ["auto", "light", "dark"] as const;
export type StatusPageThemeMode = (typeof STATUS_PAGE_THEME_MODES)[number];
export const DEFAULT_STATUS_PAGE_THEME_MODE: StatusPageThemeMode = "auto";

export const STATUS_PAGE_RANGES = ["latest", "30d", "60d", "90d"] as const;
export type StatusPageRange = (typeof STATUS_PAGE_RANGES)[number];

export const STATUS_PAGE_RANGE_DAYS: Record<
	Exclude<StatusPageRange, "latest">,
	number
> = { "30d": 30, "60d": 60, "90d": 90 };

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
	customDomain?: string | null;
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
