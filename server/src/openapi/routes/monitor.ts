import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import { GeoContinents } from "@/types/geoCheck.js";
import { MonitorMatchMethods, MonitorTypes } from "@/types/monitor.js";
import {
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdQueryValidation,
	getMonitorsWithChecksQueryValidation,
	getCertificateParamValidation,
	createMonitorBodyValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getUptimeDetailsByIdParamValidation,
	getUptimeDetailsByIdQueryValidation,
	importMonitorsBodyValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
} from "@/validation/monitorValidation.js";
import { updateNotificationsValidation } from "@/validation/notificationValidation.js";

const tags = ["monitors"];

const monitorObject = z
	.object({
		_id: z.string().openapi({ example: "65f1c2a4d8b9e0123456789a" }),
		name: z.string(),
		description: z.string().optional(),
		type: z.enum(MonitorTypes),
		url: z.string(),
		port: z.number().optional(),
		isActive: z.boolean(),
		interval: z.number(),
		status: z.enum(["up", "down", "paused", "initializing", "maintenance", "breached"]),
		statusWindowSize: z.number(),
		statusWindowThreshold: z.number(),
		ignoreTlsErrors: z.boolean(),
		useAdvancedMatching: z.boolean(),
		jsonPath: z.string().optional(),
		expectedValue: z.string().optional(),
		matchMethod: z.enum(MonitorMatchMethods).optional(),
		notifications: z.array(z.string()),
		secret: z.string().optional(),
		cpuAlertThreshold: z.number(),
		memoryAlertThreshold: z.number(),
		diskAlertThreshold: z.number(),
		tempAlertThreshold: z.number(),
		selectedDisks: z.array(z.string()),
		gameId: z.string().optional(),
		grpcServiceName: z.string().optional(),
		group: z.string().nullable().optional(),
		geoCheckEnabled: z.boolean(),
		geoCheckLocations: z.array(z.enum(GeoContinents)),
		geoCheckInterval: z.number(),
		teamId: z.string(),
		userId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough()
	.openapi("Monitor");

registry.registerPath({
	method: "get",
	path: "/monitors/team",
	tags,
	summary: "List monitors for the caller's team",
	security: bearer,
	request: { query: getMonitorsByTeamIdQueryValidation },
	responses: { "200": okJson(z.array(monitorObject)), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/team/with-checks",
	tags,
	summary: "List team monitors with their most recent checks (paginated)",
	security: bearer,
	request: { query: getMonitorsWithChecksQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/team/groups",
	tags,
	summary: "List monitor groups for the caller's team",
	security: bearer,
	responses: { "200": okJson(z.array(z.string())), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/uptime/details/{monitorId}",
	tags,
	summary: "Get uptime details for a monitor",
	security: bearer,
	request: { params: getUptimeDetailsByIdParamValidation, query: getUptimeDetailsByIdQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/hardware/details/{monitorId}",
	tags,
	summary: "Get hardware metrics detail for a monitor",
	security: bearer,
	request: { params: getHardwareDetailsByIdParamValidation, query: getHardwareDetailsByIdQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/pagespeed/details/{monitorId}",
	tags,
	summary: "Get PageSpeed detail for a monitor",
	security: bearer,
	request: { params: getHardwareDetailsByIdParamValidation, query: getHardwareDetailsByIdQueryValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/{monitorId}/geo-checks",
	tags,
	summary: "Get geo check results for a monitor",
	security: bearer,
	request: { params: getMonitorByIdParamValidation, query: getMonitorByIdQueryValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/monitors/pause/{monitorId}",
	tags,
	summary: "Toggle pause state for a monitor",
	security: bearer,
	request: { params: pauseMonitorParamValidation },
	responses: { "200": okJson(monitorObject), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/certificate/{monitorId}",
	tags,
	summary: "Get SSL certificate info for a monitor",
	security: bearer,
	request: { params: getCertificateParamValidation },
	responses: { "200": okJson(z.object({ certificateDate: z.string() })), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/monitors/notifications",
	tags,
	summary: "Bulk update notifications across monitors",
	security: bearer,
	request: { body: { content: json(updateNotificationsValidation) } },
	responses: { "200": okJson(z.object({ modifiedCount: z.number() })), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/monitors",
	tags,
	summary: "Create a new monitor",
	security: bearer,
	request: { body: { content: json(createMonitorBodyValidation) } },
	responses: { "200": okJson(monitorObject, "Monitor created"), ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/monitors",
	tags,
	summary: "Delete every monitor (superadmin only)",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/monitors/demo",
	tags,
	summary: "Insert preconfigured demo monitors",
	security: bearer,
	responses: { "200": okJson(z.number()), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/export/json",
	tags,
	summary: "Export all team monitors as JSON",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/monitors/import/json",
	tags,
	summary: "Import monitors from JSON",
	security: bearer,
	request: { body: { content: json(importMonitorsBodyValidation) } },
	responses: { "200": okJson(z.object({ imported: z.number() }).passthrough()), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/games",
	tags,
	summary: "List supported game-server types",
	security: bearer,
	responses: { "200": okJson(z.array(z.string())), ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Get a monitor by id",
	security: bearer,
	request: { params: getMonitorByIdParamValidation },
	responses: { "200": okJson(monitorObject), ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Edit a monitor",
	security: bearer,
	request: { params: getMonitorByIdParamValidation, body: { content: json(editMonitorBodyValidation) } },
	responses: { "200": okJson(monitorObject), ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Delete a monitor",
	security: bearer,
	request: { params: getMonitorByIdParamValidation },
	responses: { "200": okJson(monitorObject), ...standardErrors },
});
