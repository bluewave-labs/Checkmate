import http from "http";
import { IQueueWorker, WorkerHealth } from "@/worker/worker.interface.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "HealthServer";
const LIVENESS_STALE_MS = 30_000; // 30s ~6x POLL_MAX_MS so we don't restart workers

export interface IHealthServer {
	listen(): Promise<void>;
	close(): Promise<void>;
}

const isLive = (health: WorkerHealth): boolean => {
	if (!health.initComplete) return false; // Not init yet
	if (health.draining) return true; // Draining workers are still healthy

	if (health.lastTickAt === null) return false; // Never ticked

	if (Date.now() - health.lastTickAt >= LIVENESS_STALE_MS) return false; // Stale if last tick exceed LIVENESS_STALE_MS

	return true;
};

const isReady = (health: WorkerHealth): boolean => {
	if (health.draining) return false; // Draining workers are not ready
	return health.initComplete && health.dbConnected;
};

export class HealthServer implements IHealthServer {
	private server: http.Server;

	constructor(
		private logger: ILogger,
		private port: string,
		private worker: IQueueWorker
	) {
		this.server = http.createServer(this.handle);
	}

	private handle = (req: http.IncomingMessage, res: http.ServerResponse) => {
		const path = (req.url ?? "").split("?")[0]; // Strip query params
		if (path !== "/livez" && path !== "/readyz") {
			res.writeHead(404).end();
			return;
		}

		// Get health
		const health = this.worker.getHealth();
		const ok = path === "/livez" ? isLive(health) : isReady(health);
		const code = ok ? 200 : 503;
		res.writeHead(code, { "Content-Type": "application/json" });
		res.end(JSON.stringify(health));
	};

	listen = () => {
		return new Promise<void>((resolve) => {
			const port = Number(this.port) || 52346;
			this.server.listen(port, () => {
				this.logger.info({
					message: `Health server listening on ${port}`,
					service: SERVICE_NAME,
					method: "listen",
				});
				resolve();
			});
		});
	};

	close = () => {
		return new Promise<void>((resolve) => {
			this.server.close(() => resolve());
		});
	};
}
