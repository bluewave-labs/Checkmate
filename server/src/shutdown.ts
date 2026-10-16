import { IDb } from "@/db/db.interface.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { Server } from "http";
import { Mongoose } from "mongoose";
import { IJobScheduler } from "@/worker/worker.interface.js";
import { IHealthServer } from "@/worker/worker.health-server.js";

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
	process.on("SIGUSR2", () => shutdown(0));
	process.on("SIGINT", () => shutdown(0));
	process.on("SIGTERM", () => shutdown(0));

	process.on("unhandledRejection", (reason: unknown) => {
		log.error({ err: reason }, "Unhandled promise rejection");
		shutdown(1);
	});
	process.on("uncaughtException", (error: Error) => {
		log.error({ err: error }, "Uncaught exception");
		shutdown(1);
	});
};
