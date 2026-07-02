import http from "http";
import { IQueueWorker, WorkerHealth } from "@/worker/worker.interface.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "HealthServer";
const DEFAULT_HEALTH_PORT = 52346;
const MAX_PORT_ATTEMPTS = 20;
const LIVENESS_STALE_MS = 30_000; // 30s ~6x POLL_MAX_MS so we don't restart workers
const CONTENT_TYPE_METRICS = "text/plain; version=0.0.4; charset=utf-8";
const gauge = (name: string, help: string, value: number): string => `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name} ${value}\n`;

export interface IHealthServer {
	listen(): Promise<void>;
	close(): Promise<void>;
	address(): ReturnType<http.Server["address"]>;
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

	private metrics = async (): Promise<string> => {
		const health = this.worker.getHealth();
		const [dueBacklog, aliveWorkers] = await Promise.all([this.worker.countDueBacklog(), this.worker.countAliveWorkers()]);
		return (
			gauge("checkmate_worker_jobs_in_flight", "Jobs currently being processed by this worker", health.inFlight) +
			gauge("checkmate_worker_due_backlog", "Due check jobs not currently locked (cluster-wide)", dueBacklog) +
			gauge("checkmate_worker_alive_total", "Job-processing nodes seen within the TTL window (cluster-wide)", aliveWorkers) +
			gauge("checkmate_worker_draining", "1 if this worker is draining, else 0", health.draining ? 1 : 0)
		);
	};

	private handle = async (req: http.IncomingMessage, res: http.ServerResponse) => {
		const path = (req.url ?? "").split("?")[0]; // Strip query params

		// Metrics
		if (path === "/metrics") {
			try {
				const body = await this.metrics();
				res.writeHead(200, { "Content-Type": CONTENT_TYPE_METRICS });
				res.end(body);
			} catch (error: unknown) {
				this.logger.warn({
					message: error instanceof Error ? error.message : String(error),
					service: SERVICE_NAME,
					method: "metrics",
				});
				res.writeHead(500).end();
			}
			return;
		}

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
		return new Promise<void>((resolve, reject) => {
			let port = Number(this.port) || DEFAULT_HEALTH_PORT;
			const lastPort = port + MAX_PORT_ATTEMPTS;

			const onError = (error: NodeJS.ErrnoException) => {
				if (error.code === "EADDRINUSE" && port < lastPort) {
					this.logger.warn({
						message: `Health port ${port} in use, retrying on ${port + 1}`,
						service: SERVICE_NAME,
						method: "listen",
					});
					port++;
					this.server.listen(port);
					return;
				}
				this.server.removeListener("error", onError);
				reject(error);
			};

			this.server.on("error", onError);
			this.server.listen(port, () => {
				this.server.removeListener("error", onError);
				this.logger.info({
					message: `Health server listening on ${port}`,
					service: SERVICE_NAME,
					method: "listen",
				});
				resolve();
			});
		});
	};

	address = () => this.server.address();

	close = () => {
		return new Promise<void>((resolve) => {
			this.server.close(() => resolve());
		});
	};
}
