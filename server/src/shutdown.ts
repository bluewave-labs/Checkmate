import { IDb } from "@/db/db.interface.js";
import type { ILogger } from "@/utils/logger.js";
import type { Server } from "http";
import { Mongoose } from "mongoose";
import { IJobScheduler } from "@/worker/worker.interface.js";

type ShutdownTargets = {
	worker: IJobScheduler;
	db: IDb<Mongoose>;
	logger: ILogger;
};
export const initShutdownListener = (server: Server | null, services: ShutdownTargets) => {
	const SERVICE_NAME = "Server";
	const logger = services.logger;

	let isShuttingDown = false;

	const shutdown = async () => {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		logger.info({ message: "Attempting graceful shutdown" });

		try {
			server?.close();
			await services.worker.drain();
			await services.worker.shutdown();
			await services.db.disconnect();
			logger.info({ message: "Graceful shutdown complete" });
			process.exit(0);
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
	process.on("SIGUSR2", shutdown);
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
};
