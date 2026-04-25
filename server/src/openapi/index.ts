import "./registry.js";
import "./routes/auth.js";
import "./routes/check.js";
import "./routes/diagnostic.js";
import "./routes/geoCheck.js";
import "./routes/incident.js";
import "./routes/invite.js";
import "./routes/log.js";
import "./routes/maintenanceWindow.js";
import "./routes/monitor.js";
import "./routes/notification.js";
import "./routes/queue.js";
import "./routes/settings.js";
import "./routes/statusPage.js";

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { JsonObject } from "swagger-ui-express";
import { registry } from "./registry.js";

let cached: JsonObject | null = null;

export function getOpenApiSpec(): JsonObject {
	if (cached) return cached;

	const generator = new OpenApiGeneratorV3(registry.definitions);
	const document = generator.generateDocument({
		openapi: "3.0.0",
		info: {
			title: "Checkmate API",
			version: "1.0.0",
			description: "Generated from Zod validation schemas. Source of truth: server/src/validation/*.ts",
		},
		servers: [{ url: "/api/v1", description: "Current server" }],
	});

	cached = document as unknown as JsonObject;
	return cached;
}
