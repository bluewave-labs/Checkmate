import { IEgressController } from "@/api/controllers/egressController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { egressSummarySchema } from "@/domain/egress/egress.schema.js";

// Any authenticated role may read the summary: the client banner polls it.
export const egressRoutes: RouteTable<IEgressController> = {
	prefix: "/egress",
	tag: "egress",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getState",
			summary: "Get the instance's current egress self-check status",
			response: egressSummarySchema,
		},
	],
};
