import { z } from "zod";
import { registry } from "../registry.js";
import { bearer, json, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
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
	monitorResponseSchema,
} from "@/validation/monitorValidation.js";
import { updateNotificationsValidation } from "@/validation/notificationValidation.js";

const tags = ["monitors"];

const monitorObject = monitorResponseSchema.openapi("Monitor", {
	example: {
		_id: "65f1c2a4d8b9e0123456789a",
		name: "Marketing site",
		description: "Production marketing site monitored from the EU region",
		type: "http",
		url: "https://www.example.com",
		port: 443,
		isActive: true,
		interval: 60000,
		status: "up",
		statusWindowSize: 5,
		statusWindowThreshold: 3,
		ignoreTlsErrors: false,
		useAdvancedMatching: false,
		notifications: ["65f1c2a4d8b9e0123456789b"],
		cpuAlertThreshold: 90,
		memoryAlertThreshold: 90,
		diskAlertThreshold: 90,
		tempAlertThreshold: 80,
		selectedDisks: [],
		geoCheckEnabled: false,
		geoCheckLocations: [],
		geoCheckInterval: 300000,
		teamId: "65f1c2a4d8b9e01234567890",
		userId: "65f1c2a4d8b9e01234567891",
		createdAt: "2026-04-01T10:00:00.000Z",
		updatedAt: "2026-04-15T14:30:00.000Z",
	},
});

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
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/monitors/{monitorId}/geo-checks",
	tags,
	summary: "Get geo check results for a monitor",
	security: bearer,
	request: { params: getMonitorByIdParamValidation, query: getMonitorByIdQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
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
