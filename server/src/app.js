import express from "express";
import path from "path";
import { responseHandler } from "./middleware/responseHandler.js";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import languageMiddleware from "./middleware/languageMiddleware.js";
import swaggerUi from "swagger-ui-express";
import { handleErrors } from "./middleware/handleErrors.js";
import { setupRoutes } from "./config/routes.js";
import { generalApiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeBody, sanitizeQuery } from "./utils/sanitization.js";

export const createApp = ({ services, controllers, envSettings, frontendPath, openApiSpec }) => {
	const allowedOrigin = envSettings.clientHost;

	const app = express();
	app.use(generalApiLimiter);
	// Static files
	app.use(express.static(frontendPath));

	// Response handler
	app.use(responseHandler);

	app.use(
		cors({
			origin: allowedOrigin,
			methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
			allowedHeaders: "*",
			credentials: true,
		})
	);
	app.use(express.json());

	// Apply input sanitization middleware
	app.use(sanitizeBody());
	app.use(sanitizeQuery());

	app.use(
		helmet({
			hsts: false,
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					upgradeInsecureRequests: null,
					"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
					"object-src": ["'none'"],
					"base-uri": ["'self'"],
				},
			},
		})
	);
	app.use(
		compression({
			level: 6,
			threshold: 1024,
			filter: (req, res) => {
				if (req.headers["x-no-compression"]) {
					return false;
				}
				return compression.filter(req, res);
			},
		})
	);
	app.use(languageMiddleware(services.stringService, services.translationService, services.settingsService));
	// Swagger UI
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

	app.use("/api/v1/health", (req, res) => {
		res.json({
			status: "OK",
		});
	});

	// Main app routes
	setupRoutes(app, controllers);

	// FE routes
	app.get("*", (req, res) => {
		res.sendFile(path.join(frontendPath, "index.html"));
	});
	app.use(handleErrors);
	return app;
};
