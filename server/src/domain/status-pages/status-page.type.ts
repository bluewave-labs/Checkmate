export const StatusPageTypes = ["uptime", "infrastructure"] as const;
export type StatusPageType = (typeof StatusPageTypes)[number];

export const StatusPageThemes = ["refined", "modern", "bold", "editorial"] as const;
export type StatusPageTheme = (typeof StatusPageThemes)[number];
export const DEFAULT_STATUS_PAGE_THEME: StatusPageTheme = "refined";

export const StatusPageThemeModes = ["auto", "light", "dark"] as const;
export type StatusPageThemeMode = (typeof StatusPageThemeModes)[number];
export const DEFAULT_STATUS_PAGE_THEME_MODE: StatusPageThemeMode = "auto";

export interface StatusPageLogo {
	data: string;
	contentType: string;
}

export interface StatusPageLogoDocument {
	data: Buffer;
	contentType: string;
}

export interface StatusPage {
	id: string;
	userId: string;
	teamId: string;
	type: StatusPageType[];
	companyName: string;
	url: string;
	timezone?: string;
	color: string;
	monitors: string[];
	subMonitors: string[];
	originalMonitors?: string[];
	logo?: StatusPageLogo | null;
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
