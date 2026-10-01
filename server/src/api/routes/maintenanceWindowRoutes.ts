import { IMaintenanceWindowController } from "@/api/controllers/maintenanceWindowController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	createMaintenanceWindowBodyValidation,
	deleteMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	maintenanceWindowListResponseSchema,
	maintenanceWindowPageResponseSchema,
} from "@/api/validation/maintenanceWindowValidation.js";
import { maintenanceWindowSchema } from "@/domain/maintenance-windows/maintenance-window.schema.js";

export const maintenanceWindowRoutes: RouteTable<IMaintenanceWindowController> = {
	prefix: "/maintenance-window",
	tag: "maintenance-window",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/",
			handler: "createMaintenanceWindows",
			summary: "Create one or more maintenance windows (admin/superadmin)",
			errors: { 403: "Caller lacks the role, or a monitor is not on the team" },
			roles: ["admin", "superadmin"],
			body: createMaintenanceWindowBodyValidation,
		},
		{
			method: "get",
			path: "/team",
			handler: "getMaintenanceWindowsByTeamId",
			summary: "List maintenance windows for the caller's team",
			query: getMaintenanceWindowsByTeamIdQueryValidation,
			response: maintenanceWindowPageResponseSchema,
		},
		{
			method: "get",
			path: "/monitor/:monitorId",
			handler: "getMaintenanceWindowsByMonitorId",
			summary: "List maintenance windows for a monitor",
			params: getMaintenanceWindowsByMonitorIdParamValidation,
			response: maintenanceWindowListResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getMaintenanceWindowById",
			summary: "Get a maintenance window by id",
			errors: { 404: "Maintenance window not found" },
			params: getMaintenanceWindowByIdParamValidation,
			response: maintenanceWindowSchema,
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editMaintenanceWindow",
			summary: "Edit a maintenance window (admin/superadmin)",
			errors: { 403: "Caller lacks the role, or a monitor is not on the team", 404: "Maintenance window not found" },
			roles: ["admin", "superadmin"],
			params: editMaintenanceWindowByIdParamValidation,
			body: editMaintenanceByIdWindowBodyValidation,
			response: maintenanceWindowSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteMaintenanceWindow",
			summary: "Delete a maintenance window (admin/superadmin)",
			errors: { 404: "Maintenance window not found" },
			roles: ["admin", "superadmin"],
			params: deleteMaintenanceWindowByIdParamValidation,
		},
	],
};
