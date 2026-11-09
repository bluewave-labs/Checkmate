import WebSocket, { type RawData } from "ws";
import type { ILogger } from "@/utils/logger/logger.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const PING_INTERVAL_MS = 15_000;
// Slightly under the relay's 60 s proxy limit.
const LOCAL_REQUEST_TIMEOUT_MS = 55_000;
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const DROPPED_REQUEST_HEADERS = [
	"host",
	"connection",
	"upgrade",
	"keep-alive",
	"te",
	"trailer",
	"transfer-encoding",
	"proxy-authorization",
	"proxy-connection",
];
const DROPPED_RESPONSE_HEADERS = ["content-encoding", "transfer-encoding"];

type TunnelRequest = {
	type?: unknown;
	id?: unknown;
	method?: unknown;
	path?: unknown;
	headers?: unknown;
	body?: unknown;
};

export type TunnelStatus = {
	connected: boolean;
	lastConnectedAt: string | null;
	lastError: string | null;
	closeCode: number | null;
	enabled: boolean;
};

// The cloud is not trusted to steer this tunnel anywhere but the local
// Checkmate server: single-leading-slash paths only, the resolved URL must stay
// on the local origin, plain HTTP methods only, and hop-by-hop or host headers
// from the wire are dropped.
export const validateTunnelRequest = (msg: TunnelRequest, localTarget: string) => {
	if (typeof msg.path !== "string" || !msg.path.startsWith("/") || msg.path.startsWith("//")) {
		return null;
	}
	if (typeof msg.method !== "string" || !ALLOWED_METHODS.includes(msg.method)) {
		return null;
	}
	let url: URL;
	try {
		url = new URL(msg.path, localTarget);
	} catch {
		return null;
	}
	if (url.origin !== new URL(localTarget).origin) return null;

	const headers: Record<string, string> = {};
	for (const [name, value] of Object.entries(msg.headers ?? {})) {
		const key = name.toLowerCase();
		if (typeof value !== "string" || DROPPED_REQUEST_HEADERS.includes(key)) continue;
		headers[key] = value;
	}
	return { url, method: msg.method, headers };
};

const errorBody = (message: string) => Buffer.from(JSON.stringify({ error: message })).toString("base64");

export class ConnectTunnel {
	private ws: WebSocket | null = null;
	private enrollment: ConnectEnrollment | null = null;
	private desired = false;
	private backoff = INITIAL_BACKOFF_MS;
	private retryTimer: NodeJS.Timeout | null = null;
	private state: Omit<TunnelStatus, "enabled"> = {
		connected: false,
		lastConnectedAt: null,
		lastError: null,
		closeCode: null,
	};

	constructor(
		private localTarget: string,
		private log: ILogger,
		private pingIntervalMs: number = PING_INTERVAL_MS
	) {}

	status = (): TunnelStatus => ({ ...this.state, enabled: this.desired });

	start = (enrollment: ConnectEnrollment) => {
		this.closeSocket();
		this.enrollment = enrollment;
		this.desired = true;
		this.backoff = INITIAL_BACKOFF_MS;
		this.connect();
	};

	stop = () => {
		this.desired = false;
		this.closeSocket();
	};

	private closeSocket = () => {
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		const ws = this.ws;
		// Cleared first so this socket's close event cannot schedule a retry.
		this.ws = null;
		this.state.connected = false;
		ws?.close(1000, "disabled");
	};

	private connect = () => {
		if (!this.desired || !this.enrollment) return;
		const { connectUrl, agentId, token } = this.enrollment;

		let ws: WebSocket;
		try {
			ws = new WebSocket(`${connectUrl}?agent=${encodeURIComponent(agentId)}`, {
				headers: { authorization: `Bearer ${token}` },
			});
		} catch (error) {
			this.state.lastError = error instanceof Error ? error.message : "connection failed";
			this.scheduleRetry("connection failed");
			return;
		}
		this.ws = ws;

		ws.on("open", () => {
			if (this.ws !== ws) return;
			this.backoff = INITIAL_BACKOFF_MS;
			this.state.connected = true;
			this.state.lastConnectedAt = new Date().toISOString();
			this.state.lastError = null;
			this.log.info({ agentId }, "Connect tunnel connected");
			this.watchLiveness(ws);
		});

		ws.on("message", (data) => {
			this.handleMessage(ws, data).catch((error: unknown) => {
				this.log.error({ err: error }, "Connect tunnel request failed");
			});
		});

		ws.on("close", (code, reason) => {
			if (this.ws !== ws) return;
			this.state.closeCode = code;
			// Credential rejected or revoked: keep a slow probe so rotation on
			// the cloud side heals without a restart.
			if (code === 4001 || code === 4003) {
				this.state.lastError = `unauthorized (${code})`;
				this.backoff = MAX_BACKOFF_MS;
			}
			this.scheduleRetry(`${code} ${reason.toString()}`);
		});

		ws.on("error", (error) => {
			if (this.ws === ws) this.state.lastError = error.message;
			ws.close();
		});
	};

	// A socket can die without a close event, for example when the host sleeps
	// through the drop. Without this it would report connected indefinitely.
	private watchLiveness = (ws: WebSocket) => {
		let answered = true;
		ws.on("pong", () => {
			answered = true;
		});
		const timer = setInterval(() => {
			if (!answered) {
				ws.terminate();
				return;
			}
			answered = false;
			ws.ping();
		}, this.pingIntervalMs);
		timer.unref();
		ws.once("close", () => clearInterval(timer));
	};

	private scheduleRetry = (why: string) => {
		this.state.connected = false;
		if (!this.desired) return;
		const jitter = Math.random() * 0.3 + 0.85;
		const delay = Math.min(this.backoff * jitter, MAX_BACKOFF_MS);
		this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
		this.log.info({ why, delay: Math.round(delay) }, "Connect tunnel disconnected; retrying");
		this.retryTimer = setTimeout(this.connect, delay);
		this.retryTimer.unref();
	};

	private send = (ws: WebSocket, payload: Record<string, unknown>) => {
		if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "response", ...payload }));
	};

	private handleMessage = async (ws: WebSocket, data: RawData) => {
		let msg: TunnelRequest;
		try {
			msg = JSON.parse(data.toString()) as TunnelRequest;
		} catch {
			return;
		}
		if (msg.type !== "request") return;

		const validated = validateTunnelRequest(msg, this.localTarget);
		if (!validated) {
			this.send(ws, {
				id: msg.id,
				status: 400,
				headers: { "content-type": "application/json" },
				body: errorBody("rejected by tunnel"),
			});
			return;
		}

		try {
			const response = await fetch(validated.url, {
				method: validated.method,
				headers: validated.headers,
				body: typeof msg.body === "string" && msg.body ? Buffer.from(msg.body, "base64") : undefined,
				redirect: "manual",
				signal: AbortSignal.timeout(LOCAL_REQUEST_TIMEOUT_MS),
			});
			const body = Buffer.from(await response.arrayBuffer());
			const headers: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				if (!DROPPED_RESPONSE_HEADERS.includes(key)) headers[key] = value;
			});
			this.send(ws, {
				id: msg.id,
				status: response.status,
				headers,
				body: body.length ? body.toString("base64") : null,
			});
		} catch (error) {
			this.send(ws, {
				id: msg.id,
				status: 502,
				headers: { "content-type": "application/json" },
				body: errorBody("local target unreachable"),
			});
			// Pathname only: query strings can carry reset or invite tokens.
			this.log.error({ err: error, method: validated.method, path: validated.url.pathname }, "Connect tunnel local request failed");
		}
	};
}
