import {
	IConnectController,
	connectEnrollBodyValidation,
	connectRemoteAccessBodyValidation,
} from "@/api/controllers/connectController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";

export const connectRoutes: RouteTable<IConnectController> = {
	prefix: "/connect",
	tag: "connect",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/status",
			handler: "getStatus",
			summary: "Get Checkmate Connect agent status",
			roles: ["admin", "superadmin"],
		},
		{
			method: "post",
			path: "/enroll",
			handler: "enroll",
			summary: "Enroll this installation with Checkmate Connect",
			body: connectEnrollBodyValidation,
			roles: ["admin", "superadmin"],
		},
		{
			method: "post",
			path: "/remote-access",
			handler: "setRemoteAccess",
			summary: "Enable or disable Checkmate Connect remote access",
			body: connectRemoteAccessBodyValidation,
			roles: ["admin", "superadmin"],
		},
		{
			method: "post",
			path: "/unenroll",
			handler: "unenroll",
			summary: "Remove this installation's Checkmate Connect enrollment",
			roles: ["admin", "superadmin"],
		},
	],
};
