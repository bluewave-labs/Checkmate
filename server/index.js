import { initializeServices } from "./config/services.js";
import { initializeControllers } from "./config/controllers.js";
import { createApp } from "./app.js";
import { initShutdownListener } from "./shutdown.js";
import logger from "./utils/logger.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import SettingsService from "./service/system/settingsService.js";
import AppSettings from "./db/models/AppSettings.js";

const SERVICE_NAME = "Server";

const startApp = async () => {
	// FE path
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const openApiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "openapi.json"), "utf8"));
	const frontendPath = path.join(__dirname, "public");
	// Create services
	const settingsService = new SettingsService(AppSettings);
	const appSettings = settingsService.loadSettings();

	// Initialize services
	const services = await initializeServices(appSettings, settingsService);

	// Initialize controllers
	const controllers = initializeControllers(services);

	const app = createApp({
		services,
		controllers,
		appSettings,
		frontendPath,
		openApiSpec,
	});

	const port = appSettings.port || 52345;
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
