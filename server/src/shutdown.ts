import { IDb } from "@/db/db.interface.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { Server } from "http";
import { Mongoose } from "mongoose";
import { IJobScheduler } from "@/worker/worker.interface.js";
import { IHealthServer } from "@/worker/worker.health-server.js";

const SHUTDOWN_TIMEOUT_MS = 30_000; // Must be longer than DRAIN_TIMEOUT set in worker.db.queue

type ShutdownTargets = {
	worker: IJobScheduler;
	db: IDb<Mongoose>;
	logger: ILogger;
	healthServer?: IHealthServer;
};
export const initShutdownListener = (server: Server | null, shutdownTargets: ShutdownTargets) => {
	const SERVICE_NAME = "Server";
	const log = shutdownTargets.logger.child({ service: SERVICE_NAME });

	let isShuttingDown = false;

	const shutdown = async (exitCode: number = 0) => {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;

		setTimeout(() => process.exit(exitCode || 1), SHUTDOWN_TIMEOUT_MS).unref();

		log.info("Attempting graceful shutdown");

		try {
			server?.close();
			await shutdownTargets.worker.drain();
			await shutdownTargets.worker.shutdown();
			await shutdownTargets.healthServer?.close();
			await shutdownTargets.db.disconnect();
			log.info("Graceful shutdown complete");
			process.exit(exitCode);
		} catch (error) {
			log.error({ err: error }, "Graceful shutdown failed");
			process.exit(1);
		}
	};

	const onSignal = () => {
		if (isShuttingDown) process.exit(1);
		void shutdown(0);
	};

	process.on("SIGUSR2", onSignal);
	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);

	process.on("unhandledRejection", (reason: unknown) => {
		if (isShuttingDown) return;
		log.error({ err: reason }, "Unhandled promise rejection");
		shutdown(1);
	});
	process.on("uncaughtException", (error: Error) => {
		if (isShuttingDown) return;
		log.error({ err: error }, "Uncaught exception");
		shutdown(1);
	});
};
