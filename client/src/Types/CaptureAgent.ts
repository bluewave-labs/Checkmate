export const DeviceOSTypes = ["windows", "linux", "macos", "unknown"] as const;
export type DeviceOS = (typeof DeviceOSTypes)[number];

export const DeviceAuthTypes = ["ssh", "winrm", "none"] as const;
export type DeviceAuthType = (typeof DeviceAuthTypes)[number];

export interface CaptureAgent {
	id: string;
	teamId: string;
	name: string;
	url: string;
	isActive: boolean;
	canCollectMetrics: boolean;
	canExecuteScripts: boolean;
	lastSeen?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CaptureAgentDevice {
	id: string;
	captureAgentId: string;
	teamId: string;
	name: string;
	hostname: string;
	ipAddress?: string;
	os: DeviceOS;
	authType: DeviceAuthType;
	hasCredentials: boolean;
	sshKeyFingerprint?: string;
	port?: number;
	tags?: string[];
	createdAt?: string;
	updatedAt?: string;
}

export interface CaptureAgentHealth {
	reachable: boolean;
	version?: string;
	capabilities?: { metrics: boolean; scripts: boolean };
	latencyMs?: number;
}
