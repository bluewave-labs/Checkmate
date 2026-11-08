import { RequestHandler } from "express";
import { z } from "zod";
import { Handler } from "./controllerUtils.js";

// Checkmate Connect is an optional cloud companion service. This controller
// only proxies the admin UI to the local Connect sidecar agent; when no agent
// is configured (CONNECT_AGENT_URL unset) every endpoint reports unavailable
// and the rest of Checkmate is unaffected.

export const connectEnrollBodyValidation = z.object({
	connectUrl: z.string().regex(/^wss:\/\/[a-z0-9.-]+\/api\/tunnel$/, "Invalid Connect tunnel URL"),
	agentId: z.string().regex(/^[a-z0-9-]{1,64}$/, "Invalid agent id"),
	token: z.string().regex(/^cmk_[a-f0-9]{48}$/, "Invalid credential"),
	// Control-plane origin; optional for pre-0.4.0 credential blocks (ADR-002).
	apiUrl: z
		.string()
		.regex(/^https:\/\/[a-z0-9.-]+$/, "Invalid Connect API URL")
		.optional(),
});

export const connectRemoteAccessBodyValidation = z.object({
	enabled: z.boolean(),
});

export const connectBackupRunBodyValidation = z.object({
	kind: z.enum(["full", "config"]).optional(),
});

export const connectBackupRestoreBodyValidation = z.object({
	backupId: z.string().regex(/^[0-9a-f-]{36}$/, "Invalid backup id"),
});

export const connectBackupScheduleBodyValidation = z.object({
	enabled: z.boolean(),
	intervalHours: z.number().int().min(1).max(168).optional(),
	kind: z.enum(["full", "config"]).optional(),
});

export interface IConnectController {
	getStatus: RequestHandler;
	enroll: RequestHandler;
	setRemoteAccess: RequestHandler;
	unenroll: RequestHandler;
	getBackupStatus: RequestHandler;
	getBackupList: RequestHandler;
	createBackupRecoveryKey: RequestHandler;
	runBackup: RequestHandler;
	restoreBackup: RequestHandler;
	setBackupSchedule: RequestHandler;
}

const AGENT_TIMEOUT_MS = 5000;

class ConnectController implements IConnectController {
	private agentUrl() {
		return process.env.CONNECT_AGENT_URL ?? "";
	}

	private async agentRequest(path: string, init?: { method?: string; body?: unknown }) {
		const headers: Record<string, string> = { "content-type": "application/json" };
		const adminToken = process.env.CONNECT_ADMIN_TOKEN;
		if (adminToken) headers.authorization = `Bearer ${adminToken}`;
		const res = await fetch(`${this.agentUrl()}${path}`, {
			method: init?.method ?? "GET",
			headers,
			body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
			signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
		});
		const data = await res.json().catch(() => ({}));
		return { ok: res.ok, status: res.status, data };
	}

	getStatus: Handler = async (_req, res) => {
		if (!this.agentUrl()) {
			res.json({ success: true, msg: "Connect agent not configured", data: { available: false } });
			return;
		}
		try {
			const result = await this.agentRequest("/status");
			res.json({
				success: true,
				msg: "Connect status retrieved",
				data: { available: true, ...result.data },
			});
		} catch {
			res.json({
				success: true,
				msg: "Connect agent unreachable",
				data: { available: false, unreachable: true },
			});
		}
	};

	enroll: Handler = async (req, res) => {
		const body = connectEnrollBodyValidation.parse(req.body);
		const result = await this.agentRequest("/enroll", { method: "POST", body });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Installation enrolled" : "Enrollment failed",
			data: result.data,
		});
	};

	setRemoteAccess: Handler = async (req, res) => {
		const body = connectRemoteAccessBodyValidation.parse(req.body);
		const result = await this.agentRequest("/remote-access", { method: "POST", body });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok
				? body.enabled
					? "Remote access enabled"
					: "Remote access disabled"
				: "Updating remote access failed",
			data: result.data,
		});
	};

	unenroll: Handler = async (_req, res) => {
		const result = await this.agentRequest("/unenroll", { method: "POST" });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Installation unenrolled" : "Unenroll failed",
			data: result.data,
		});
	};

	// ---- Cloud backups (Phase 3b) ----

	getBackupStatus: Handler = async (_req, res) => {
		const result = await this.agentRequest("/backup/status");
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Backup status retrieved" : "Backup status failed",
			data: result.data,
		});
	};

	getBackupList: Handler = async (_req, res) => {
		const result = await this.agentRequest("/backup/list");
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Backup list retrieved" : "Backup list failed",
			data: result.data,
		});
	};

	createBackupRecoveryKey: Handler = async (_req, res) => {
		// The response contains the recovery key exactly once; it is never
		// persisted on the Checkmate side and never logged.
		const result = await this.agentRequest("/backup/recovery-key", { method: "POST" });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Recovery key generated" : "Recovery key generation failed",
			data: result.data,
		});
	};

	runBackup: Handler = async (req, res) => {
		const body = connectBackupRunBodyValidation.parse(req.body);
		const result = await this.agentRequest("/backup/run", { method: "POST", body });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Backup started" : "Backup start failed",
			data: result.data,
		});
	};

	restoreBackup: Handler = async (req, res) => {
		const body = connectBackupRestoreBodyValidation.parse(req.body);
		const result = await this.agentRequest("/backup/restore", { method: "POST", body });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Restore started" : "Restore start failed",
			data: result.data,
		});
	};

	setBackupSchedule: Handler = async (req, res) => {
		const body = connectBackupScheduleBodyValidation.parse(req.body);
		const result = await this.agentRequest("/backup/schedule", { method: "POST", body });
		res.status(result.ok ? 200 : result.status).json({
			success: result.ok,
			msg: result.ok ? "Backup schedule updated" : "Backup schedule update failed",
			data: result.data,
		});
	};
}

export default ConnectController;
