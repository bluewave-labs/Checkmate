import { registry } from "../registry.js";
import { bearer, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";

const tags = ["queue"];

registry.registerPath({
	method: "get",
	path: "/queue/jobs",
	tags,
	summary: "List queued monitor jobs (admin/superadmin)",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/queue/metrics",
	tags,
	summary: "Get queue runtime metrics (admin/superadmin)",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/queue/all-metrics",
	tags,
	summary: "Get queue metrics across all monitors (admin/superadmin)",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/queue/flush",
	tags,
	summary: "Flush the monitor job queue (admin/superadmin)",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});
