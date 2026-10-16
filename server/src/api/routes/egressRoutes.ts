import { IEgressController } from "@/api/controllers/egressController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { egressStateResponseSchema } from "@/api/validation/egressValidation.js";

// Any authenticated role may read the state: the client banner polls it.
export const egressRoutes: RouteTable<IEgressController> = {
	prefix: "/egress",
	tag: "egress",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getState",
			summary: "Get the instance's current egress self-check state",
			response: egressStateResponseSchema,
		},
	],
};
