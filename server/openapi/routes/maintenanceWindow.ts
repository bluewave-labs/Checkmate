import { registry } from "../registry.js";
import { bearer, json, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	createMaintenanceWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	deleteMaintenanceWindowByIdParamValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
} from "@/validation/maintenanceWindowValidation.js";

const tags = ["maintenance-window"];

registry.registerPath({
	method: "post",
	path: "/maintenance-window",
	tags,
	summary: "Create one or more maintenance windows",
	security: bearer,
	request: { body: { content: json(createMaintenanceWindowBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/maintenance-window/team",
	tags,
	summary: "List maintenance windows for the caller's team",
	security: bearer,
	request: { query: getMaintenanceWindowsByTeamIdQueryValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/maintenance-window/monitor/{monitorId}",
	tags,
	summary: "List maintenance windows for a monitor",
	security: bearer,
	request: { params: getMaintenanceWindowsByMonitorIdParamValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/maintenance-window/{id}",
	tags,
	summary: "Get a maintenance window by id",
	security: bearer,
	request: { params: getMaintenanceWindowByIdParamValidation },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "patch",
	path: "/maintenance-window/{id}",
	tags,
	summary: "Edit a maintenance window",
	security: bearer,
	request: { params: editMaintenanceWindowByIdParamValidation, body: { content: json(editMaintenanceByIdWindowBodyValidation) } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "delete",
	path: "/maintenance-window/{id}",
	tags,
	summary: "Delete a maintenance window",
	security: bearer,
	request: { params: deleteMaintenanceWindowByIdParamValidation },
	responses: { "200": okJsonNoData(), ...standardErrors },
});
