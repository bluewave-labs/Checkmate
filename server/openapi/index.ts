import { registerRoutes } from "openapi/registerRoutes.js";
import "./registry.js";
import "./routes/log.js";
import "./routes/settings.js";
import "./routes/statusPage.js";
import { tagRoutes } from "@/api/routes/tagRoutes.js";

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { JsonObject } from "swagger-ui-express";
import { registry } from "./registry.js";
import { authRoutes } from "@/api/routes/authRoutes.js";
import { checkRoutes } from "@/api/routes/checkRoutes.js";
import { diagnosticRoutes } from "@/api/routes/diagnosticRoutes.js";
import { geoCheckRoutes } from "@/api/routes/geoCheckRoutes.js";
import { incidentRoutes } from "@/api/routes/incidentRoutes.js";
import { inviteRoutes } from "@/api/routes/inviteRoutes.js";
import { maintenanceWindowRoutes } from "@/api/routes/maintenanceWindowRoutes.js";
import { monitorRoutes } from "@/api/routes/monitorRoutes.js";
import { notificationRoutes } from "@/api/routes/notificationRoutes.js";
import { proxyRoutes } from "@/api/routes/proxyRoutes.js";
import { queueRoutes } from "@/api/routes/queueRoutes.js";
let cached: JsonObject | null = null;

registerRoutes(registry, tagRoutes);
registerRoutes(registry, authRoutes);
registerRoutes(registry, checkRoutes);
registerRoutes(registry, diagnosticRoutes);
registerRoutes(registry, geoCheckRoutes);
registerRoutes(registry, incidentRoutes);
registerRoutes(registry, inviteRoutes);
registerRoutes(registry, maintenanceWindowRoutes);
registerRoutes(registry, monitorRoutes);
registerRoutes(registry, notificationRoutes);
registerRoutes(registry, proxyRoutes);
registerRoutes(registry, queueRoutes);
export function getOpenApiSpec(): JsonObject {
	if (cached) return cached;

	const generator = new OpenApiGeneratorV3(registry.definitions);
	const document = generator.generateDocument({
		openapi: "3.0.0",
		info: {
			title: "Checkmate API",
			version: "1.0.0",
			description: "Generated from Zod validation schemas. Source of truth: server/src/api/validation/*.ts",
		},
		servers: [{ url: "/api/v1", description: "Current server" }],
		tags: [
			{ name: "auth", description: "Sign up, log in, password reset, and the authenticated user's profile." },
			{ name: "monitors", description: "Configure and inspect monitors (HTTP, port, ping, hardware, docker, game, gRPC) for the caller's team." },
			{ name: "checks", description: "Individual monitoring check results, including history, summaries, and bulk deletes." },
			{ name: "geo-checks", description: "Geographic check results for monitors with multi-region probing enabled." },
			{ name: "incidents", description: "Downtime incidents derived from monitor state changes, including filtering and CSV export." },
			{
				name: "notifications",
				description:
					"Notification channels (email, webhook, Slack, Discord, PagerDuty, Matrix, Rocket.Chat, Teams, Telegram, Pushover, Twilio) and test alerts.",
			},
			{ name: "maintenance-window", description: "Scheduled maintenance windows during which monitors do not generate incidents or alerts." },
			{ name: "status-page", description: "Public status pages, their configuration, and the monitors they expose." },
			{ name: "settings", description: "Global application settings (admin/superadmin)." },
			{ name: "proxies", description: "Outbound proxy servers for routing HTTP monitor checks, team-scoped with an instance-wide admin listing." },
			{ name: "invite", description: "Team invitations and accepting them." },
			{ name: "queue", description: "Background job queue introspection and admin actions (admin/superadmin)." },
			{ name: "diagnostic", description: "System diagnostics for the running server (admin/superadmin)." },
			{ name: "logs", description: "Application logs for the running server (admin/superadmin)." },
		],
	});

	cached = document as unknown as JsonObject;
	return cached;
}
