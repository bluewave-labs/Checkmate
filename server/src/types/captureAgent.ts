// Capture Agent types
//
// A CaptureAgent is the next-generation collector/executor that replaces the
// pre-existing ProbeServer. A single agent can both collect infrastructure
// metrics ("metrics") and execute scripts on registered devices ("scripts").
// The secret field stores a bcrypt hash used to authenticate inbound
// agent-initiated calls; agentTokenCipher stores the AES-256-GCM encrypted
// plaintext token so that the server can authenticate outbound calls.

export const DeviceOSTypes = ["windows", "linux", "macos", "unknown"] as const;
export type DeviceOS = (typeof DeviceOSTypes)[number];

export const DeviceAuthTypes = ["ssh", "winrm", "none"] as const;
export type DeviceAuthType = (typeof DeviceAuthTypes)[number];

export const CaptureAgentAuditActions = [
	"captureAgent.register",
	"captureAgent.update",
	"captureAgent.delete",
	"captureAgentDevice.add",
	"captureAgentDevice.update",
	"captureAgentDevice.delete",
] as const;
export type CaptureAgentAuditAction = (typeof CaptureAgentAuditActions)[number];

export interface CaptureAgent {
	id: string;
	teamId: string;
	name: string;
	url: string;
	secret: string;
	agentTokenCipher?: string;
	isActive: boolean;
	canCollectMetrics: boolean;
	canExecuteScripts: boolean;
	lastSeen?: string;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

export type CaptureAgentPublic = Omit<CaptureAgent, "secret" | "agentTokenCipher">;

export interface CaptureAgentDevice {
	id: string;
	captureAgentId: string;
	teamId: string;
	name: string;
	hostname: string;
	ipAddress?: string;
	os: DeviceOS;
	authType: DeviceAuthType;
	username?: string;
	encryptedPassword?: string;
	sshKeyFingerprint?: string;
	port?: number;
	tags?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CaptureAgentDevicePublic extends Omit<CaptureAgentDevice, "encryptedPassword" | "username"> {
	hasCredentials: boolean;
}

export interface CaptureAgentHealth {
	reachable: boolean;
	version?: string;
	capabilities?: { metrics: boolean; scripts: boolean };
	latencyMs?: number;
}
