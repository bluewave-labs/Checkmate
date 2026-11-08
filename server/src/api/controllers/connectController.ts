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
});

export const connectRemoteAccessBodyValidation = z.object({
	enabled: z.boolean(),
});

export interface IConnectController {
	getStatus: RequestHandler;
	enroll: RequestHandler;
	setRemoteAccess: RequestHandler;
	unenroll: RequestHandler;
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
}

export default ConnectController;
