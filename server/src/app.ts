import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { handleErrors } from "@/middleware/handleErrors.js";
import { generalApiLimiter } from "@/middleware/rateLimiter.js";
import { sanitizeBody, sanitizeQuery } from "@/middleware/sanitization.js";
import { setupRoutes } from "@/config/routes.js";
import { InitializedServices } from "@/config/services.js";
import { InitializedControllers } from "@/config/controllers.js";
import { EnvConfig } from "@/service/system/settingsService.js";

export const createApp = ({
	services,
	controllers,
	envSettings,
	frontendPath,
	openApiSpec,
}: {
	services: InitializedServices;
	controllers: InitializedControllers;
	envSettings: EnvConfig;
	frontendPath: string;
	openApiSpec: any;
}) => {
	const allowedOrigin = envSettings.clientHost;
	const app = express();

	app.use(generalApiLimiter);

	app.use(
		cors({
			origin: allowedOrigin,
			methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
			allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
			credentials: true,
		})
	);

	app.use(express.static(frontendPath));

	app.use(express.json());
	app.use(cookieParser());

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
	// Swagger UI
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

	app.use("/api/v1/health", (req, res) => {
		res.json({
			status: "OK",
		});
	});

	// Main app routes
	setupRoutes(app, controllers, services);

	// FE routes
	app.get("*", (req, res) => {
		res.sendFile(path.join(frontendPath, "index.html"));
	});
	app.use(handleErrors);
	return app;
};
