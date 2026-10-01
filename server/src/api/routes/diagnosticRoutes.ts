import { IDiagnosticController } from "@/api/controllers/diagnosticController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { diagnosticsSchema } from "@/domain/diagnostics/diagnostic.schema.js";

export const diagnosticRoutes: RouteTable<IDiagnosticController> = {
	prefix: "/diagnostic",
	tag: "diagnostic",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/system",
			handler: "getSystemStats",
			summary: "Get system diagnostics (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: diagnosticsSchema,
		},
	],
};
