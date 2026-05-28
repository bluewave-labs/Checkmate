import type { ScriptAuditAction } from "@/types/script.js";
import type { CaptureAgentAuditAction } from "@/types/captureAgent.js";

export type AuditAction = ScriptAuditAction | CaptureAgentAuditAction;

export interface AuditLogInput {
	teamId: string;
	userId: string;
	action: AuditAction;
	resourceType: string;
	resourceId: string;
	metadata?: Record<string, unknown>;
}

export interface IAuditRepository {
	log(entry: AuditLogInput): Promise<void>;
}
