export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export interface Monitor {
	id: string;
	userId: string;
	teamId: string;
	name: string;
	description: string;
	statusWindow: boolean[];
	statusWindowSize: number;
	statusWindowThreshold: number;
	type: MonitorType;
	ignoreTlsErrors: boolean;
	url: string;
	isActive: boolean;
	interval: number;
	notifications: string[];
	alertThreshold: number;
	selectedDisks: string[];
	group: string | null;
	cpuAlertThreshold: number;
	memoryAlertThreshold: number;
	diskAlertThreshold: number;
	tempAlertThreshold: number;
	createdAt: string;
	updatedAt: string;
	status: boolean;
}
