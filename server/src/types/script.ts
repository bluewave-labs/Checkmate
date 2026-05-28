// Script Monitor types
//
// These types describe everything needed for the "script" monitor flow:
//   - Script: the script definition stored encrypted at rest
//   - ProbeServer: an external probe agent registered with Checkmate
//   - ScriptExecutionResult: the result of an execution returned from
//     a Capture or Probe agent
//
// SECURITY: Plaintext script bodies must never appear in logs, network
// responses (other than to admins via GET /scripts/:id), or in entity
// lists. The encryptedBody is AES-256-GCM ciphertext and bodyHash is
// the SHA-256 of the original plaintext (used for tamper detection
// before execution).

export const ScriptRuntimes = ["bash", "powershell", "python"] as const;
export type ScriptRuntime = (typeof ScriptRuntimes)[number];

export const ScriptExecutionTargets = ["capture", "probe"] as const;
export type ScriptExecutionTarget = (typeof ScriptExecutionTargets)[number];

export const ScriptAuditActions = [
	"script.create",
	"script.update",
	"script.delete",
	"script.execute",
	"probe.register",
	"probe.deregister",
] as const;
export type ScriptAuditAction = (typeof ScriptAuditActions)[number];

export const SCRIPT_BODY_MAX_BYTES = 64 * 1024;
export const SCRIPT_NAME_MAX_LENGTH = 128;
export const SCRIPT_MAX_EXECUTION_TIME_MS_DEFAULT = 30_000;
export const SCRIPT_MAX_EXECUTION_TIME_MS_HARD_CAP = 300_000;
export const SCRIPT_OUTPUT_RETENTION_DAYS_DEFAULT = 30;
export const SCRIPT_AUDIT_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 90 days

export interface Script {
	id: string;
	teamId: string;
	name: string;
	description?: string;
	runtime: ScriptRuntime;
	bodyHash: string;
	encryptedBody: string;
	parameters: Record<string, string>;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export type ScriptSummary = Omit<Script, "encryptedBody">;

export interface ProbeServer {
	id: string;
	teamId: string;
	name: string;
	url: string;
	probeSecret: string;
	isActive: boolean;
	lastSeen?: string;
	createdAt: string;
	updatedAt: string;
}

export type ProbeServerSummary = Omit<ProbeServer, "probeSecret">;

export interface ScriptExecutionResult {
	exitCode: number;
	stdout: string;
	stderr: string;
	executionTimeMs: number;
	timedOut: boolean;
	// Optional convenience fields populated after parsing the script output.
	// They are pre-computed so downstream consumers (status update,
	// notifications) do not have to re-parse stdout.
	parsedStatus?: "Success" | "Info" | "Warning" | "Error" | "Critical";
	parsedTarget?: string;
	parsedMessage?: string;
	severity?: "success" | "info" | "warning" | "error" | "critical";
	datapoints?: Array<{ name: string; value: number; unit?: string }>;
	statusBoolean?: boolean;
}

export interface ScriptStatusPayload {
	stdout: string;
	stderr: string;
	exitCode: number;
	executionTimeMs: number;
	timedOut: boolean;
}

export interface AuditLogEntry {
	id: string;
	teamId: string;
	userId: string;
	action: ScriptAuditAction;
	resourceType: string;
	resourceId: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
}
