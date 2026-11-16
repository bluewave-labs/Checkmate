import type { IHeartbeatController } from "@/api/controllers/heartbeatController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { heartbeatExitCodeParamValidation, heartbeatParamValidation, heartbeatQueryValidation } from "@/api/validation/index.js";
import { heartbeatResponseSchema } from "@/domain/heartbeat/heartbeat.schema.js";
import { heartbeatErrors } from "@/domain/heartbeat/heartbeat.errors.js";

const common = {
	query: heartbeatQueryValidation,
	response: heartbeatResponseSchema,
	errors: [heartbeatErrors.notFound],
} as const;

// `/fail` must come before `/:exitCode`: Express matches in declaration order, and "fail" would otherwise 400 on z.coerce.number()
export const heartbeatRoutes: RouteTable<IHeartbeatController> = {
	prefix: "/heartbeat",
	tag: "heartbeat",
	auth: "none",
	routes: [
		{
			method: "get",
			path: "/:pingKey/:slug",
			handler: "ping",
			summary: "Record a successful heartbeat",
			params: heartbeatParamValidation,
			...common,
		},
		{
			method: "post",
			path: "/:pingKey/:slug",
			handler: "ping",
			summary: "Record a successful heartbeat",
			params: heartbeatParamValidation,
			...common,
		},
		{
			method: "get",
			path: "/:pingKey/:slug/fail",
			handler: "fail",
			summary: "Record a failed run",
			params: heartbeatParamValidation,
			...common,
		},
		{
			method: "post",
			path: "/:pingKey/:slug/fail",
			handler: "fail",
			summary: "Record a failed run",
			params: heartbeatParamValidation,
			...common,
		},
		{
			method: "get",
			path: "/:pingKey/:slug/:exitCode",
			handler: "exitCode",
			summary: "Record a run by exit code",
			params: heartbeatExitCodeParamValidation,
			...common,
		},
		{
			method: "post",
			path: "/:pingKey/:slug/:exitCode",
			handler: "exitCode",
			summary: "Record a run by exit code",
			params: heartbeatExitCodeParamValidation,
			...common,
		},
	],
};
