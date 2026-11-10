import type { IConnectController } from "@/api/controllers/connectController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { connectEnrollBodyValidation, connectRemoteAccessBodyValidation } from "@/api/validation/connectValidation.js";
import { connectErrors } from "@/domain/connect/connect.errors.js";
import { connectStatusSchema } from "@/domain/connect/connect.schema.js";

export const connectRoutes: RouteTable<IConnectController> = {
	prefix: "/connect",
	tag: "connect",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/status",
			handler: "getStatus",
			summary: "Get this installation's Checkmate Connect enrollment status (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/enroll",
			handler: "enroll",
			summary: "Enroll this installation with Checkmate Connect using a credential block (superadmin)",
			roles: ["superadmin"],
			body: connectEnrollBodyValidation,
			errors: [connectErrors.hostNotAllowed, connectErrors.encryptionKeyMissing],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/unenroll",
			handler: "unenroll",
			summary: "Remove this installation's Checkmate Connect enrollment (superadmin)",
			roles: ["superadmin"],
			response: connectStatusSchema,
		},
		{
			method: "post",
			path: "/remote-access",
			handler: "setRemoteAccess",
			summary: "Turn Checkmate Connect remote access on or off (superadmin)",
			roles: ["superadmin"],
			body: connectRemoteAccessBodyValidation,
			errors: [connectErrors.notEnrolled, connectErrors.stateUnavailable],
			response: connectStatusSchema,
		},
	],
};
