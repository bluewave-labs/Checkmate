import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IDiagnosticController } from "@/api/controllers/diagnosticController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { unknownResponseSchema } from "@/api/routes/openapiHelpers.js";

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
			response: unknownResponseSchema,
		},
	],
};

export const createDiagnosticRoutes = (diagnosticController: IDiagnosticController, verifyJWT: RequestHandler): Router => {
	const router = Router();
	router.get("/system", verifyJWT, isAllowed(["admin", "superadmin"]), diagnosticController.getSystemStats);
	return router;
};
