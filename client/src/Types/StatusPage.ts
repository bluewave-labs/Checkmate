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
	createdAt: string;
	updatedAt: string;
}

export interface StatusPageResponse {
	statusPage: StatusPage;
	monitors: Monitor[];
}
