import "../registry.js";
import { z } from "zod";
import { registry } from "../registry.js";
import { successEnvelope, successEnvelopeNoData, errorEnvelope } from "../schemas/common.js";
import {
	MonitorSchema,
	MonitorWithChecksListSchema,
	CertificateInfoSchema,
	NotificationsUpdateResultSchema,
	ImportResultSchema,
} from "../schemas/monitor.js";
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

const bearer = [{ bearerAuth: [] }];
const tags = ["monitors"];

const json = <T extends z.ZodTypeAny>(schema: T) => ({
	"application/json": { schema },
});

const standardErrors = {
	"401": { description: "Unauthorized", content: json(errorEnvelope) },
	"403": { description: "Forbidden", content: json(errorEnvelope) },
	"500": { description: "Internal server error", content: json(errorEnvelope) },
};

registry.registerPath({
	method: "get",
	path: "/monitors/team",
	tags,
	summary: "List monitors for the caller's team",
	security: bearer,
	request: { query: getMonitorsByTeamIdQueryValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.array(MonitorSchema))) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/team/with-checks",
	tags,
	summary: "List team monitors with their most recent checks (paginated)",
	security: bearer,
	request: { query: getMonitorsWithChecksQueryValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(MonitorWithChecksListSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/team/groups",
	tags,
	summary: "List monitor groups for the caller's team",
	security: bearer,
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.array(z.string()))) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/uptime/details/{monitorId}",
	tags,
	summary: "Get uptime details for a monitor",
	security: bearer,
	request: {
		params: getUptimeDetailsByIdParamValidation,
		query: getUptimeDetailsByIdQueryValidation,
	},
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.unknown())) },
		"400": { description: "Validation error", content: json(errorEnvelope) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/hardware/details/{monitorId}",
	tags,
	summary: "Get hardware metrics detail for a monitor",
	security: bearer,
	request: {
		params: getHardwareDetailsByIdParamValidation,
		query: getHardwareDetailsByIdQueryValidation,
	},
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.unknown())) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/pagespeed/details/{monitorId}",
	tags,
	summary: "Get PageSpeed detail for a monitor",
	security: bearer,
	request: {
		params: getHardwareDetailsByIdParamValidation,
		query: getHardwareDetailsByIdQueryValidation,
	},
	responses: {
		"200": { description: "OK", content: json(successEnvelopeNoData) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/{monitorId}/geo-checks",
	tags,
	summary: "Get geo check results for a monitor",
	security: bearer,
	request: {
		params: getMonitorByIdParamValidation,
		query: getMonitorByIdQueryValidation,
	},
	responses: {
		"200": { description: "OK", content: json(successEnvelopeNoData) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "post",
	path: "/monitors/pause/{monitorId}",
	tags,
	summary: "Toggle pause state for a monitor",
	security: bearer,
	request: { params: pauseMonitorParamValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(MonitorSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/certificate/{monitorId}",
	tags,
	summary: "Get SSL certificate info for a monitor",
	security: bearer,
	request: { params: getCertificateParamValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(CertificateInfoSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "patch",
	path: "/monitors/notifications",
	tags,
	summary: "Bulk update notifications across monitors",
	security: bearer,
	request: { body: { content: json(updateNotificationsValidation) } },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(NotificationsUpdateResultSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "post",
	path: "/monitors",
	tags,
	summary: "Create a new monitor",
	security: bearer,
	request: { body: { content: json(createMonitorBodyValidation) } },
	responses: {
		"200": { description: "Monitor created", content: json(successEnvelope(MonitorSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "delete",
	path: "/monitors",
	tags,
	summary: "Delete every monitor (superadmin only)",
	security: bearer,
	responses: {
		"200": { description: "OK", content: json(successEnvelopeNoData) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "post",
	path: "/monitors/demo",
	tags,
	summary: "Insert preconfigured demo monitors",
	security: bearer,
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.number())) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/export/json",
	tags,
	summary: "Export all team monitors as JSON",
	security: bearer,
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.unknown())) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "post",
	path: "/monitors/import/json",
	tags,
	summary: "Import monitors from JSON",
	security: bearer,
	request: { body: { content: json(importMonitorsBodyValidation) } },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(ImportResultSchema)) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/games",
	tags,
	summary: "List supported game-server types",
	security: bearer,
	responses: {
		"200": { description: "OK", content: json(successEnvelope(z.array(z.string()))) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "get",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Get a monitor by id",
	security: bearer,
	request: { params: getMonitorByIdParamValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(MonitorSchema)) },
		"404": { description: "Monitor not found", content: json(errorEnvelope) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "patch",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Edit a monitor",
	security: bearer,
	request: {
		params: getMonitorByIdParamValidation,
		body: { content: json(editMonitorBodyValidation) },
	},
	responses: {
		"200": { description: "OK", content: json(successEnvelope(MonitorSchema)) },
		"404": { description: "Monitor not found", content: json(errorEnvelope) },
		...standardErrors,
	},
});

registry.registerPath({
	method: "delete",
	path: "/monitors/{monitorId}",
	tags,
	summary: "Delete a monitor",
	security: bearer,
	request: { params: getMonitorByIdParamValidation },
	responses: {
		"200": { description: "OK", content: json(successEnvelope(MonitorSchema)) },
		"404": { description: "Monitor not found", content: json(errorEnvelope) },
		...standardErrors,
	},
});
