import type { z } from "zod";
import type {
	publicStatusPageMonitorSchema,
	publicStatusPagePayloadSchema,
	statusPageLogoSchema,
	statusPageSchema,
} from "@/domain/status-pages/status-page.schema.js";

export const StatusPageTypes = ["uptime", "infrastructure"] as const;
export type StatusPageType = (typeof StatusPageTypes)[number];

export const StatusPageThemes = ["refined", "modern", "bold", "editorial", "minimal"] as const;
export type StatusPageTheme = (typeof StatusPageThemes)[number];
export const DEFAULT_STATUS_PAGE_THEME: StatusPageTheme = "refined";

export const StatusPageThemeModes = ["auto", "light", "dark"] as const;
export type StatusPageThemeMode = (typeof StatusPageThemeModes)[number];
export const DEFAULT_STATUS_PAGE_THEME_MODE: StatusPageThemeMode = "auto";

export const StatusPageDayRanges = ["30d", "60d", "90d"] as const;
export type StatusPageDayRange = (typeof StatusPageDayRanges)[number];
export const StatusPageRanges = ["latest", ...StatusPageDayRanges] as const;
export type StatusPageRange = (typeof StatusPageRanges)[number];
export const STATUS_PAGE_RANGE_DAYS: Record<StatusPageDayRange, number> = {
	"30d": 30,
	"60d": 60,
	"90d": 90,
};

export type StatusPageLogo = z.infer<typeof statusPageLogoSchema>;
export type StatusPage = z.infer<typeof statusPageSchema>;
export type PublicStatusPageMonitor = z.infer<typeof publicStatusPageMonitorSchema>;
export type PublicStatusPagePayload = z.infer<typeof publicStatusPagePayloadSchema>;
