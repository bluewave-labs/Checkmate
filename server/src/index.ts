import { initializeServices } from "./config/services.js";
import { initializeControllers } from "./config/controllers.js";
import { createApp } from "./app.js";
import { initShutdownListener } from "@/shutdown.js";
import { validateEnv } from "@/validation/envValidation.js";
import { getOpenApiSpec } from "@/openapi/index.js";
import { fileURLToPath } from "url";
import path from "path";

import Logger, { ILogger } from "@/utils/logger.js";
import { SettingsService } from "@/service/index.js";

const SERVICE_NAME = "Server";
let logger: ILogger;

const startApp = async () => {
	// Validate environment variables first
	const env = validateEnv();

	// FE path
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const openApiSpec = getOpenApiSpec();
	const frontendPath = path.join(__dirname, "..", "public");

	// Create settings service (env only — DB repository injected after connect)
	const settingsService = new SettingsService(env);
	const envSettings = settingsService.loadSettings();

	// Create logger
	logger = new Logger({ envSettings });

	// Initialize services (connects DB, creates repositories, injects settingsRepository)
	const services = await initializeServices({ logger, envSettings, settingsService });

	// Initialize controllers
	const controllers = initializeControllers(services);

	const app = createApp({
		services,
		controllers,
		envSettings,
		frontendPath,
		openApiSpec,
	});

	const server = app.listen(env.PORT, () => {
		logger.info({ message: `Server started on port:${env.PORT}` });
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
