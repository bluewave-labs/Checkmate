import { IMaintenanceWindowController } from "@/api/controllers/maintenanceWindowController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { unknownResponseSchema } from "@/api/routes/openapiHelpers.js";
import {
	createMaintenanceWindowBodyValidation,
	deleteMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	editMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
} from "@/api/validation/maintenanceWindowValidation.js";

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
			roles: ["admin", "superadmin"],
			body: createMaintenanceWindowBodyValidation,
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/team",
			handler: "getMaintenanceWindowsByTeamId",
			summary: "List maintenance windows for the caller's team",
			query: getMaintenanceWindowsByTeamIdQueryValidation,
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/monitor/:monitorId",
			handler: "getMaintenanceWindowsByMonitorId",
			summary: "List maintenance windows for a monitor",
			params: getMaintenanceWindowsByMonitorIdParamValidation,
			response: unknownResponseSchema,
		},
		{
			method: "get",
			path: "/:id",
			handler: "getMaintenanceWindowById",
			summary: "Get a maintenance window by id",
			params: getMaintenanceWindowByIdParamValidation,
			response: unknownResponseSchema,
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editMaintenanceWindow",
			summary: "Edit a maintenance window (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: editMaintenanceWindowByIdParamValidation,
			body: editMaintenanceByIdWindowBodyValidation,
			response: unknownResponseSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteMaintenanceWindow",
			summary: "Delete a maintenance window (admin/superadmin)",
			roles: ["admin", "superadmin"],
			params: deleteMaintenanceWindowByIdParamValidation,
		},
	],
};
