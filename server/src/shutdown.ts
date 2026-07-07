import { IDb } from "@/db/db.interface.js";
import type { ILogger } from "@/utils/logger.js";
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
	const logger = shutdownTargets.logger;

	let isShuttingDown = false;

	const shutdown = async (exitCode: number = 0) => {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		logger.info({ message: "Attempting graceful shutdown" });

		try {
			server?.close();
			await shutdownTargets.worker.drain();
			await shutdownTargets.worker.shutdown();
			await shutdownTargets.healthServer?.close();
			await shutdownTargets.db.disconnect();
			logger.info({ message: "Graceful shutdown complete" });
			process.exit(exitCode);
		} catch (error) {
			const err = error as Error;
			logger.error({
				message: err.message,
				service: SERVICE_NAME,
				method: "shutdown",
				stack: err.stack,
			});
			process.exit(1);
		}
	};
	process.on("SIGUSR2", () => shutdown(0));
	process.on("SIGINT", () => shutdown(0));
	process.on("SIGTERM", () => shutdown(0));

	process.on("unhandledRejection", (reason: unknown) => {
		const err = reason instanceof Error ? reason : new Error(String(reason));
		logger.error({ message: `Unhandled promise rejection: ${err.message}`, service: SERVICE_NAME, method: "unhandledRejection", stack: err.stack });
		shutdown(1);
	});
	process.on("uncaughtException", (error: Error) => {
		logger.error({ message: `Uncaught exception: ${error.message}`, service: SERVICE_NAME, method: "uncaughtException", stack: error.stack });
		shutdown(1);
	});
};
