import { InitializedServices } from "./config/services.js";
import { logger } from "./utils/logger.js";

export const initShutdownListener = (server: any, services: InitializedServices) => {
	const SERVICE_NAME = "Server";

	let isShuttingDown = false;

	const shutdown = async () => {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		logger.info({ message: "Attempting graceful shutdown" });

		try {
			server.close();
			await services.jobQueue.shutdown();
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
