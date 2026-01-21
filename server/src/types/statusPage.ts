export const StatusPageTypes = ["uptime"] as const;
export type StatusPageType = (typeof StatusPageTypes)[number];

export interface StatusPageLogo {
	data: Buffer;
	contentType: string;
}

export interface StatusPage {
	id: string;
	userId: string;
	teamId: string;
	type: StatusPageType;
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
	customCSS: string;
	createdAt: string;
	updatedAt: string;
}
