import { initializeServices } from "./config/services.js";
import { initializeControllers } from "./config/controllers.js";
import { createApp } from "./app.js";
import { initShutdownListener } from "./shutdown.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { runMigrations } from "./db/migration/index.js";

import Logger, { ILogger } from "@/utils/logger.js";
import SettingsService from "@/service/system/settingsService.js";
import { MongoSettingsRepository } from "./repositories/index.js";

const SERVICE_NAME = "Server";
let logger: ILogger;

const startApp = async () => {
	// FE path
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const openApiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "../openapi.json"), "utf8"));
	const frontendPath = path.join(__dirname, "..", "public");

	// Create services
	const settingsRepository = new MongoSettingsRepository();
	const settingsService = new SettingsService(settingsRepository);

	const envSettings = settingsService.loadSettings();

	// Create logger
	logger = new Logger({ envSettings });

	// Initialize services
	const services = await initializeServices({ logger, envSettings, settingsService, settingsRepository });

	await runMigrations(logger);

	// Initialize controllers
	const controllers = initializeControllers(services);

	const app = createApp({
		services,
		controllers,
		envSettings,
		frontendPath,
		openApiSpec,
	});

	const port = envSettings.port || 52345;
	const server = app.listen(port, () => {
		logger.info({ message: `Server started on port:${port}` });
	});

	initShutdownListener(server, services);
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
