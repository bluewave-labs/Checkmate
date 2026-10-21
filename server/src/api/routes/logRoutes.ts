import { ILogController } from "@/api/controllers/logController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { logListResponseSchema } from "@/api/validation/logValidation.js";

export const logRoutes: RouteTable<ILogController> = {
	prefix: "/logs",
	tag: "logs",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getLogs",
			summary: "Get application logs (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: logListResponseSchema,
		},
	],
};
