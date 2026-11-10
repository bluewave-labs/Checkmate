import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { ConnectEnrollment, ConnectTunnelStatus } from "@/domain/connect/connect.type.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { Got } from "got";
import type WebSocket from "ws";

const SERVICE_NAME = "ConnectTunnel";
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const LOCAL_REQUEST_TIMEOUT_MS = 55_000;
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

	private scheduleRetry = () => {
		this.state = { ...this.state, connected: false };
		if (!this.running) return;
		const delay = Math.min(this.backoffMs * (0.85 + Math.random() * 0.3), MAX_BACKOFF_MS);
		this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
		this.logger.info({ closeCode: this.state.closeCode, delayMs: Math.round(delay) }, "Connect tunnel disconnected; retrying");
		this.retryTimer = setTimeout(this.connect, delay);
		this.retryTimer.unref();
	};

	private closeSocket = () => {
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = null;
		const socket = this.socket;
		this.socket = null;
		this.state = { ...this.state, connected: false };
		socket?.close(1000, "disabled");
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
			this.logger.info({ agentId }, "Connect tunnel connected");
		});

		socket.on("close", (code: number) => {
			if (this.socket !== socket) return;
			this.socket = null;
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
