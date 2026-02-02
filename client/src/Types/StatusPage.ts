import type { Monitor } from "@/Types/Monitor";

export interface StatusPage {
	id: string;
	userId: string;
	teamId: string;
	type: string;
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
	customCSS: string;
	createdAt: string;
	updatedAt: string;
}

export interface StatusPageResponse {
	statusPage: StatusPage;
	monitors: Monitor[];
}
