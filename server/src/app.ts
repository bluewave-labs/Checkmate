import express from "express";
import path from "path";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import swaggerUi, { type JsonObject } from "swagger-ui-express";
import { handleErrors } from "@/api/middleware/handleErrors.js";
import { generalApiLimiter } from "@/api/middleware/rateLimiter.js";
import { sanitizeBody, sanitizeQuery } from "@/api/middleware/sanitization.js";
import { setupRoutes } from "@/config/routes.js";
import { InitializedControllers } from "@/config/controllers.js";
import { EnvConfig } from "@/domain/app-settings/app-settings.service.js";
import { createStatusPageCorsOrigin } from "@/api/middleware/statusPageCorsOrigin.js";
import { isPublicStatusPageApiPath } from "@/api/middleware/statusPagePublicApiPath.js";
import { ApiServices } from "@/config/services.api.js";

export const createApp = ({
	apiServices: services,
	controllers,
	envSettings,
	frontendPath,
	openApiSpec,
}: {
	apiServices: ApiServices;
	controllers: InitializedControllers;
	envSettings: EnvConfig;
	frontendPath: string;
	openApiSpec: JsonObject;
}) => {
	const allowedOrigin = envSettings.clientHost;
	const app = express();
	const defaultCorsOptions: CorsOptions = {
		origin: allowedOrigin,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
		allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
		credentials: true,
	};
	const publicStatusPageCorsOrigin = createStatusPageCorsOrigin(allowedOrigin, services.statusPagesRepository);

	const devMode = envSettings.nodeEnv === "development";
	app.use(generalApiLimiter(devMode));

	app.use((req, res, next) => {
		const corsOptions = isPublicStatusPageApiPath(req.method, req.path)
			? { ...defaultCorsOptions, origin: publicStatusPageCorsOrigin }
			: defaultCorsOptions;

		return cors(corsOptions)(req, res, next);
	});

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
	// Swagger UI — dynamically set server URL from request
	app.use("/api-docs", swaggerUi.serve, (req: express.Request, res: express.Response, next: express.NextFunction) => {
		const protocol = req.protocol;
		const host = req.get("host");
		const dynamicSpec = {
			...openApiSpec,
			servers: [
				{
					url: `${protocol}://${host}/api/v1`,
					description: "Current Server",
				},
				...openApiSpec.servers,
			],
		};
		swaggerUi.setup(dynamicSpec)(req, res, next);
	});

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
	app.use(handleErrors(services.logger));
	return app;
};
