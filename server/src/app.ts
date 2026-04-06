import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import swaggerUi, { type JsonObject } from "swagger-ui-express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
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
	openApiSpec: JsonObject;
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

	app.use("/api/v1/health", async (req, res) => {
		const healthStatus = {
			status: "OK",
			timestamp: new Date().toISOString(),
			services: {
				database: { status: "unknown", message: "" },
				queue: { status: "unknown", message: "" },
				email: { status: "unknown", message: "" },
			},
		};

		try {
			// Database health check
			try {
				// Check if mongoose is connected and ready
				if (mongoose.connection.readyState === 1) {
					// 1 = connected
					healthStatus.services.database = { status: "healthy", message: "Connected" };
				} else {
					throw new Error(`Database not connected (state: ${mongoose.connection.readyState})`);
				}
			} catch (error) {
				healthStatus.services.database = {
					status: "unhealthy",
					message: error instanceof Error ? error.message : "Database connection failed",
				};
				healthStatus.status = "DEGRADED";
			}

			// Queue health check
			try {
				const queueMetrics = await services.jobQueue.getMetrics();
				healthStatus.services.queue = {
					status: "healthy",
					message: `Active jobs: ${queueMetrics.activeJobs}, Total jobs: ${queueMetrics.jobs}`,
				};
			} catch (error) {
				healthStatus.services.queue = {
					status: "unhealthy",
					message: error instanceof Error ? error.message : "Queue service unavailable",
				};
				healthStatus.status = "DEGRADED";
			}

			// Email service health check (basic connectivity test)
			try {
				const emailConfig = await services.settingsService.getDBSettings();
				if (emailConfig.systemEmailHost && emailConfig.systemEmailPort) {
					// Check if email configuration is present and valid
					const testTransporter = nodemailer.createTransport({
						host: emailConfig.systemEmailHost,
						port: Number(emailConfig.systemEmailPort),
						secure: emailConfig.systemEmailSecure,
						connectionTimeout: 5000,
					});

					await testTransporter.verify();
					testTransporter.close();

					healthStatus.services.email = { status: "healthy", message: "SMTP connection verified" };
				} else {
					healthStatus.services.email = { status: "not_configured", message: "Email settings not configured" };
				}
			} catch {
				healthStatus.services.email = {
					status: "unhealthy",
					message: "Email service unavailable",
				};
				// Don't mark overall status as degraded for email issues
			}
		} catch {
			healthStatus.status = "ERROR";
			healthStatus.services.database.message = "Health check failed";
		}

		const statusCode = healthStatus.status === "OK" ? 200 : healthStatus.status === "DEGRADED" ? 200 : 503;

		res.status(statusCode).json(healthStatus);
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
