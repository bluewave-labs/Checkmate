import { IAppVersionController } from "@/api/controllers/appVersionController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { appVersionResponseSchema } from "@/api/validation/appVersionValidation.js";

export const appVersionRoutes: RouteTable<IAppVersionController> = {
	prefix: "/app-version",
	tag: "app-version",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/",
			handler: "getVersionInfo",
			summary: "Get the running version and the latest published release",
			response: appVersionResponseSchema,
		},
	],
};
