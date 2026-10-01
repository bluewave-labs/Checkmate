import { z } from "zod";
import { dailyCheckBucketSchema } from "@/domain/checks/check.schema.js";
import { monitorSchema } from "@/domain/monitors/monitor.schema.js";
import { StatusPageDayRanges, StatusPageThemeModes, StatusPageThemes, StatusPageTypes } from "./status-page.type.js";

export const statusPageLogoSchema = z.object({
	data: z.string(),
	contentType: z.string(),
});

export const statusPageSchema = z
	.object({
		id: z.string(),
		userId: z.string(),
		teamId: z.string(),
		type: z.array(z.enum(StatusPageTypes)),
		companyName: z.string(),
		url: z.string(),
		customDomain: z.string().nullable(),
		timezone: z.string().optional(),
		color: z.string(),
		monitors: z.array(z.string()),
		subMonitors: z.array(z.string()),
		originalMonitors: z.array(z.string()),
		logo: statusPageLogoSchema.optional(),
		isPublished: z.boolean(),
		showCharts: z.boolean(),
		showUptimePercentage: z.boolean(),
		showAdminLoginLink: z.boolean(),
		showInfrastructure: z.boolean(),
		customCSS: z.string(),
		theme: z.enum(StatusPageThemes),
		themeMode: z.enum(StatusPageThemeModes),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "StatusPage" });

// url and port are present only when the showURL setting is enabled; dailyChecks only when range !== "latest".
export const publicStatusPageMonitorSchema = monitorSchema
	.pick({ id: true, name: true, type: true, status: true, uptimePercentage: true, recentChecks: true })
	.extend({
		url: z.string().optional(),
		port: z.number().optional(),
		dailyChecks: z.array(dailyCheckBucketSchema).optional(),
	});

const publicStatusPagePayloadExample = {
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
		originalMonitors: [],
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
};

// range, bucketTimezone and checkTTLDays are present only when range !== "latest".
export const publicStatusPagePayloadSchema = z
	.object({
		statusPage: statusPageSchema,
		monitors: z.array(publicStatusPageMonitorSchema),
		range: z.enum(StatusPageDayRanges).optional(),
		bucketTimezone: z.string().optional(),
		checkTTLDays: z.number().optional(),
	})
	.meta({ id: "PublicStatusPagePayload", example: publicStatusPagePayloadExample });
