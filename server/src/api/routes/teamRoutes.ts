import type { ITeamController } from "@/api/controllers/teamController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { heartbeatKeyResponseSchema, heartbeatKeyStatusResponseSchema } from "@/domain/teams/team.schema.js";
import { teamErrors } from "@/domain/teams/team.errors.js";

export const teamRoutes: RouteTable<ITeamController> = {
	prefix: "/teams",
	tag: "teams",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/heartbeat-key",
			handler: "getHeartbeatKeyStatus",
			summary: "Whether the caller's team has a heartbeat ping key (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: heartbeatKeyStatusResponseSchema,
		},
		{
			method: "post",
			path: "/heartbeat-key",
			handler: "rotateHeartbeatKey",
			summary: "Generate or rotate the team's heartbeat ping key; the key is returned once (admin/superadmin)",
			errors: [teamErrors.notFound],
			roles: ["admin", "superadmin"],
			response: heartbeatKeyResponseSchema,
		},
	],
};
