import { registry } from "../registry.js";
import { bearer, multipart, okJson, okJsonNoData, okUnknown, standardErrors } from "../helpers.js";
import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	publicStatusPagePayloadResponseSchema,
	resolveStatusPageQueryValidation,
} from "@/api/validation/statusPageValidation.js";

const tags = ["status-page"];

const publicStatusPageObject = publicStatusPagePayloadResponseSchema.openapi("PublicStatusPagePayload", {
	example: {
		statusPage: {
			id: "65f1c2a4d8b9e0123456789c",
			userId: "65f1c2a4d8b9e01234567891",
			teamId: "65f1c2a4d8b9e01234567890",
			type: ["uptime"],
			companyName: "Acme",
			url: "acme-status",
			customDomain: null,
			timezone: "America/Toronto",
			color: "#4169E1",
			monitors: ["65f1c2a4d8b9e0123456789a"],
			subMonitors: [],
			isPublished: true,
			showCharts: true,
			showUptimePercentage: true,
			showAdminLoginLink: false,
			showInfrastructure: false,
			customCSS: "",
			theme: "refined",
			themeMode: "auto",
			createdAt: "2026-04-01T10:00:00.000Z",
			updatedAt: "2026-04-15T14:30:00.000Z",
		},
		range: "90d",
		bucketTimezone: "America/Toronto",
		checkTTLDays: 30,
		monitors: [
			{
				id: "65f1c2a4d8b9e0123456789a",
				name: "API",
				type: "http",
				status: "up",
				uptimePercentage: 0.9987,
				recentChecks: [],
				dailyChecks: [
					{ monitorId: "65f1c2a4d8b9e0123456789a", date: "2026-07-19", totalChecks: 2880, upChecks: 2877, downChecks: 3, avgResponseTime: 142 },
				],
			},
		],
	},
});

registry.registerPath({
	method: "get",
	path: "/status-page/team",
	tags,
	summary: "List status pages for the caller's team",
	security: bearer,
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "post",
	path: "/status-page",
	tags,
	summary: "Create a status page (logo upload optional)",
	security: bearer,
	request: { body: { content: multipart(createStatusPageBodyValidation.shape, "logo") } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "put",
	path: "/status-page/{id}",
	tags,
	summary: "Update a status page (logo upload optional)",
	security: bearer,
	request: { body: { content: multipart(createStatusPageBodyValidation.shape, "logo") } },
	responses: { "200": okUnknown, ...standardErrors },
});

registry.registerPath({
	method: "get",
	path: "/status-page/resolve",
	tags,
	summary: "Resolve a published status page by custom domain",
	request: { query: resolveStatusPageQueryValidation },
	responses: { "200": okJson(publicStatusPageObject), "404": { description: "Status page not found" }, "500": standardErrors["500"] },
});

registry.registerPath({
	method: "get",
	path: "/status-page/{url}",
	tags,
	summary: "Get a public status page by its URL slug",
	request: { params: getStatusPageParamValidation, query: getStatusPageQueryValidation },
	responses: { "200": okJson(publicStatusPageObject), "404": { description: "Status page not found" }, "500": standardErrors["500"] },
});

registry.registerPath({
	method: "delete",
	path: "/status-page/{id}",
	tags,
	summary: "Delete a status page",
	security: bearer,
	responses: { "200": okJsonNoData(), ...standardErrors },
});
