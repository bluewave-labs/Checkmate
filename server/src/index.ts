import { buildShared } from "@/config/services.shared.js";
import { buildApi } from "@/config/services.api.js";
import { buildWorker } from "@/config/services.worker.js";

import { initializeControllers } from "./config/controllers.js";
import { createApp } from "./app.js";
import { initShutdownListener } from "@/shutdown.js";
import { validateEnv } from "@/config/envValidation.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import Logger, { ILogger } from "@/utils/logger.js";
import { SettingsService } from "@/domain/app-settings/app-settings.service.js";
import { JobScheduler } from "@/worker/worker.job-scheduler.js";
import { IJobScheduler } from "@/worker/worker.interface.js";
import { HealthServer, IHealthServer } from "@/worker/worker.health-server.js";
const SERVICE_NAME = "Server";
let logger: ILogger;

const startApp = async () => {
	// ***********************
	// Basic setup
	// ***********************

	logger = new Logger();
	const env = validateEnv(logger);
	logger.setLogLevel(env.LOG_LEVEL);
	const settingsService = new SettingsService(env);
	const envSettings = settingsService.loadSettings();
	const { queueMode, queuePrimaryProcesses } = envSettings;

	logger.info({
		message: `Queue mode: ${queueMode}`,
		service: SERVICE_NAME,
		method: "startApp",
	});

	logger.info({
		message: `Process jobs: ${queueMode === "worker" ? true : queuePrimaryProcesses}`,
		service: SERVICE_NAME,
		method: "startApp",
	});

	// ***********************
	// Build shared services
	// ***********************
	const shared = await buildShared({ logger, envSettings, settingsService });

	// ***********************
	// Worker node path, don't need API
	// ***********************
	if (queueMode === "worker") {
		const { worker } = await buildWorker(shared, envSettings);
		const healthServer = new HealthServer(logger, env.HEALTH_PORT, worker);
		await healthServer.listen();
		logger.info({ message: "Worker instance started. API will not be started", service: SERVICE_NAME });
		initShutdownListener(null, { worker, db: shared.db, logger, healthServer });
		return;
	}

	// ***********************
	// Primary node path
	// ***********************
	let scheduler: IJobScheduler;
	let healthServer: IHealthServer | undefined;

	// ***********************
	//Primary node processes jobs, need full worker
	// ***********************
	if (queuePrimaryProcesses === true) {
		const { worker } = await buildWorker(shared, envSettings);
		healthServer = new HealthServer(logger, env.HEALTH_PORT, worker);
		await healthServer.listen();
		scheduler = worker;
	}
	// ***********************
	// Primary node does not process jobs, only need scheduler
	// ***********************
	else {
		scheduler = new JobScheduler(shared.jobsRepository, shared.queueWorkersRepository, shared.monitorsRepository, queueMode, logger, shared.workerId);
		await scheduler.init(); // register in the queue_workers registry + reconcile (seed the jobs collection)
	}

	const services = buildApi(shared, scheduler);

	// ***********************
	// FE assets always needed for primary node
	// ***********************

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const openApiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "../openapi.json"), "utf8"));
	const frontendPath = path.join(__dirname, "..", "public");

	const controllers = initializeControllers(services);

	const app = createApp({
		apiServices: services,
		controllers,
		envSettings,
		frontendPath,
		openApiSpec,
	});
	const server = app.listen(env.PORT, () => {
		logger.info({ message: `Server started on port:${env.PORT}` });
	});

	initShutdownListener(server, { ...services, healthServer });
};

startApp().catch((error) => {
	logger.error({
		message: error.message,
		service: SERVICE_NAME,
		method: "startApp",
		stack: error.stack,
	});
	process.exit(1);
});
