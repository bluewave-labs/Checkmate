import { IJobQueueController } from "@/api/controllers/queueController.js";
import { RouteTable } from "@/api/routes/defineRoutes.js";
import { getQueueJobsQueryValidation, queueAllMetricsResponseSchema } from "@/api/validation/queueValidation.js";
import { workerJobsPageSchema, workerMetricsSchema } from "@/worker/worker.schema.js";

export const queueRoutes: RouteTable<IJobQueueController> = {
	prefix: "/queue",
	tag: "queue",
	auth: "jwt",
	routes: [
		{
			method: "get",
			path: "/jobs",
			handler: "getJobs",
			summary: "List queued monitor jobs (admin/superadmin)",
			roles: ["admin", "superadmin"],
			query: getQueueJobsQueryValidation,
			response: workerJobsPageSchema,
		},
		{
			method: "get",
			path: "/metrics",
			handler: "getMetrics",
			summary: "Get queue runtime metrics (admin/superadmin)",
			roles: ["admin", "superadmin"],
			response: workerMetricsSchema,
		},
		{
			method: "get",
			path: "/all-metrics",
			handler: "getAllMetrics",
			summary: "Get queue metrics across all monitors (admin/superadmin)",
			roles: ["admin", "superadmin"],
			query: getQueueJobsQueryValidation,
			response: queueAllMetricsResponseSchema,
		},
		{
			method: "post",
			path: "/flush",
			handler: "flushQueue",
			summary: "Flush the monitor job queue (admin/superadmin)",
			roles: ["admin", "superadmin"],
		},
	],
};
