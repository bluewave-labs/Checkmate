import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ConnectEnrollment, ConnectTunnelRequest, ConnectTunnelResponse, ConnectTunnelStatus } from "@/domain/connect/connect.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { Got } from "got";
import type WebSocket from "ws";
import type { RawData } from "ws";
import type { IncomingHttpHeaders } from "node:http";

const SERVICE_NAME = "ConnectTunnel";
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const LOCAL_REQUEST_TIMEOUT_MS = 55_000;
const PING_INTERVAL_MS = 15_000;
const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
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
] as const;
const DROPPED_RESPONSE_HEADERS = ["content-encoding", "transfer-encoding"] as const;
const UNAUTHORIZED_CLOSE_CODES: readonly number[] = [4001, 4003];

export interface IConnectTunnel {
	start(enrollment: ConnectEnrollment): void;
	stop(): void;
	status(): ConnectTunnelStatus;
}

export class ConnectTunnel implements IConnectTunnel {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private enrollment: ConnectEnrollment | null = null;
	private running = false;
	private backoffMs = INITIAL_BACKOFF_MS;
	private retryTimer: NodeJS.Timeout | null = null;
	private state: ConnectTunnelStatus = { connected: false, lastConnectedAt: null, lastError: null, closeCode: null };
	private socket: WebSocket | null = null;

	constructor(
		private WS: typeof WebSocket,
		private got: Got,
		private settingsService: ISettingsService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private localTarget = () => `http://127.0.0.1:${this.settingsService.getSettings().port}`;

	private watchLiveness = (socket: WebSocket) => {
		let answered = true;
		socket.on("pong", () => {
			answered = true;
		});
		const timer = setInterval(() => {
			if (!answered) {
				if (this.socket === socket) {
					this.state = { ...this.state, lastError: "relay stopped responding" };
					this.logger.warn("Connect tunnel stopped responding; reconnecting");
				}
				socket.terminate();
				return;
			}
			answered = false;
			socket.ping();
		}, PING_INTERVAL_MS);
		timer.unref();
		socket.once("close", () => clearInterval(timer));
	};

	private scheduleRetry = () => {
		this.state = { ...this.state, connected: false };
		if (!this.running) return;
		const delay = Math.min(this.backoffMs * (0.85 + Math.random() * 0.3), MAX_BACKOFF_MS);
		this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
		this.logger.info({ delayMs: Math.round(delay) }, "Connect tunnel reconnecting");
		this.retryTimer = setTimeout(this.connect, delay);
		this.retryTimer.unref();
	};

	private closeSocket = () => {
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		const socket = this.socket;
		this.socket = null;
		this.state = { ...this.state, connected: false };
		if (!socket) return;
		this.logger.info("Connect tunnel closed");
		socket.close(1000, "disabled");
	};

	private isTunnelRequest = (message: unknown): message is Pick<ConnectTunnelRequest, "type" | "id"> & Record<string, unknown> => {
		if (typeof message !== "object" || message === null) return false;
		if (!("type" in message) || !("id" in message)) return false;
		return message.type === "request" && typeof message.id === "string" && message.id.length > 0;
	};

	private validateTunnelRequest = (message: Pick<ConnectTunnelRequest, "type" | "id"> & Record<string, unknown>, localTarget: string) => {
		const { path, body } = message;
		if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
		const method = ALLOWED_METHODS.find((allowed) => allowed === message.method);
		if (!method) return null;
		let url: URL;
		try {
			url = new URL(path, localTarget);
		} catch {
			return null;
		}
		if (url.origin !== new URL(localTarget).origin) return null;
		if (body !== undefined && body !== null && typeof body !== "string") return null;
		const headers: Record<string, string> = {};
		if (typeof message.headers === "object" && message.headers !== null && !Array.isArray(message.headers)) {
			for (const [name, value] of Object.entries(message.headers)) {
				const key = name.toLowerCase();
				if (typeof value !== "string" || DROPPED_REQUEST_HEADERS.some((dropped) => dropped === key)) continue;
				headers[key] = value;
			}
		}
		return {
			id: message.id,
			url,
			method,
			headers,
			body: body ? Buffer.from(body, "base64") : undefined,
		};
	};

	private errorResponse = (id: string, status: number, error: string): ConnectTunnelResponse => {
		return {
			type: "response",
			id,
			status,
			headers: { "content-type": "application/json" },
			body: Buffer.from(JSON.stringify({ error })).toString("base64"),
		};
	};

	private responseHeaders = (headers: IncomingHttpHeaders): Record<string, string> => {
		const filtered: Record<string, string> = {};
		for (const [name, value] of Object.entries(headers)) {
			if (value === undefined || DROPPED_RESPONSE_HEADERS.some((dropped) => dropped === name)) continue;
			filtered[name] = Array.isArray(value) ? value.join(", ") : value;
		}
		return filtered;
	};

	private send = (socket: WebSocket, response: ConnectTunnelResponse) => {
		if (socket.readyState !== this.WS.OPEN) return;
		socket.send(JSON.stringify(response));
	};

	private handleMessage = async (socket: WebSocket, data: RawData) => {
		let message: unknown;
		try {
			message = JSON.parse(data.toString());
		} catch {
			return;
		}

		if (!this.isTunnelRequest(message)) return;

		const request = this.validateTunnelRequest(message, this.localTarget());
		if (!request) {
			this.send(socket, this.errorResponse(message.id, 400, "rejected by tunnel"));
			return;
		}
		try {
			const response = await this.got(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
				responseType: "buffer",
				followRedirect: false,
				throwHttpErrors: false,
				retry: { limit: 0 },
				timeout: { request: LOCAL_REQUEST_TIMEOUT_MS },
			});
			this.send(socket, {
				type: "response",
				id: request.id,
				status: response.statusCode,
				headers: this.responseHeaders(response.headers),
				body: response.body.length > 0 ? Buffer.from(response.body).toString("base64") : null,
			});
		} catch (error: unknown) {
			this.send(socket, this.errorResponse(request.id, 502, "local target unreachable"));
			this.logger.error({ err: error, method: request.method, path: request.url.pathname }, "Connect tunnel local request failed");
		}
	};

	private connect = () => {
		if (!this.running || !this.enrollment) return;
		const { connectUrl, agentId, token } = this.enrollment;
		let socket: WebSocket;
		try {
			socket = new this.WS(`${connectUrl}?agent=${encodeURIComponent(agentId)}`, {
				headers: { authorization: `Bearer ${token}` },
			});
		} catch (error: unknown) {
			this.state = { ...this.state, lastError: error instanceof Error ? error.message : "connection failed" };
			this.scheduleRetry();
			return;
		}
		this.socket = socket;

		socket.on("open", () => {
			if (this.socket !== socket) return;
			this.backoffMs = INITIAL_BACKOFF_MS;
			this.state = { ...this.state, connected: true, lastConnectedAt: new Date().toISOString(), lastError: null };
			this.watchLiveness(socket);
			this.logger.info({ agentId }, "Connect tunnel connected");
		});

		socket.on("message", (data: RawData) => {
			if (this.socket !== socket) return;
			this.handleMessage(socket, data).catch((error: unknown) => {
				this.logger.error({ err: error }, "Connect tunnel request failed");
			});
		});

		socket.on("close", (code: number, reason: Buffer) => {
			if (this.socket !== socket) return;
			this.socket = null;
			this.logger.warn({ closeCode: code, reason: reason.toString() }, "Connect tunnel disconnected");
			this.state = { ...this.state, connected: false, closeCode: code };
			if (UNAUTHORIZED_CLOSE_CODES.includes(code)) {
				this.state = { ...this.state, lastError: `unauthorized (${code})` };
				this.backoffMs = MAX_BACKOFF_MS;
			}
			this.scheduleRetry();
		});

		socket.on("error", (error: unknown) => {
			if (this.socket === socket) this.state = { ...this.state, lastError: error instanceof Error ? error.message : "unknown error" };
			socket.close();
		});
	};

	start = (enrollment: ConnectEnrollment) => {
		this.closeSocket();
		this.enrollment = enrollment;
		this.running = true;
		this.backoffMs = INITIAL_BACKOFF_MS;
		this.connect();
	};
	stop = () => {
		this.running = false;
		this.closeSocket();
	};
	status = (): ConnectTunnelStatus => {
		return { ...this.state };
	};
}
