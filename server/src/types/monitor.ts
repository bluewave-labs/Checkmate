export const MonitorTypes = ["http", "ping", "pagespeed", "hardware", "docker", "port", "game"] as const;
export type MonitorType = (typeof MonitorTypes)[number];

export interface MonitorThresholds {
	usage_cpu?: number;
	usage_memory?: number;
	usage_disk?: number;
	usage_temperature?: number;
}

export type MonitorMatchMethod = "equal" | "include" | "regex" | "";

export interface Monitor {
	id: string;
	userId: string;
	teamId: string;
	name: string;
	description?: string;
	status?: boolean;
	statusWindow: boolean[];
	statusWindowSize: number;
	statusWindowThreshold: number;
	type: MonitorType;
	ignoreTlsErrors: boolean;
	jsonPath?: string;
	expectedValue?: string;
	matchMethod?: MonitorMatchMethod;
	url: string;
	port?: number;
	isActive: boolean;
	interval: number;
	uptimePercentage?: number;
	notifications: string[];
	secret?: string;
	thresholds?: MonitorThresholds;
	alertThreshold: number;
	cpuAlertThreshold: number;
	memoryAlertThreshold: number;
	diskAlertThreshold: number;
	tempAlertThreshold: number;
	selectedDisks: string[];
	gameId?: string;
	group: string | null;
	createdAt: string;
	updatedAt: string;
}
