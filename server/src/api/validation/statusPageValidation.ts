import { z } from "zod";
import { booleanCoercion, dnsHostnameRegex, timezoneValidation } from "./shared.js";
import { StatusPageTypes, StatusPageThemes, StatusPageThemeModes, StatusPageRanges } from "@/domain/status-pages/status-page.type.js";
import { MonitorTypes, MonitorStatuses } from "@/domain/monitors/monitor.type.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";
import { cssReferencesExternalResource } from "@/utils/customCss.js";
import { ImageMimeTypes } from "@/types/upload.js";

//****************************************
// Status Page Validations
//****************************************

export const getStatusPageParamValidation = z.object({
	url: z.string().min(1, "URL is required"),
});

export const getStatusPageQueryValidation = z.object({
	type: z.union([z.enum(StatusPageTypes), z.array(z.enum(StatusPageTypes))]).transform((val) => (Array.isArray(val) ? val : [val])),
	range: z.enum(StatusPageRanges).optional().default("latest"),
});

export const resolveStatusPageQueryValidation = getStatusPageQueryValidation.extend({
	domain: z.string().optional(),
});

const customDomainValidation = z.preprocess(
	(val) => {
		if (val === undefined || val === null) {
			return undefined;
		}
		return normalizeStatusPageDomain(String(val));
	},
	z.union([z.string().regex(dnsHostnameRegex, "Enter a valid domain name (e.g. status.example.com)"), z.null()]).optional()
);

export const createStatusPageBodyValidation = z
	.object({
		type: z.union([z.enum(StatusPageTypes), z.array(z.enum(StatusPageTypes))]).transform((val) => (Array.isArray(val) ? val : [val])),
		companyName: z.string().min(1, "Company name is required"),
		url: z.string().regex(/^[a-zA-Z0-9_-]+$/, {
			message: "URL can only contain letters, numbers, underscores, and hyphens",
		}),
		customDomain: customDomainValidation,
		timezone: timezoneValidation.optional(),
		color: z.string().optional(),
		monitors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Must be a valid monitor ID")).min(1, "At least one monitor is required"),
		subMonitors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
		deleteSubmonitors: z.boolean().optional(),
		isPublished: booleanCoercion,
		showCharts: booleanCoercion.optional(),
		showUptimePercentage: booleanCoercion,
		showAdminLoginLink: booleanCoercion.optional(),
		showInfrastructure: booleanCoercion.optional(),
		customCSS: z
			.string()
			.max(100000, "Custom CSS must be at most 100000 characters")
			.refine((css) => !cssReferencesExternalResource(css), {
				message: "Custom CSS cannot reference external URLs or use @import",
			})
			.optional(),
		removeLogo: z.union([z.literal("true"), z.literal("false")]).optional(),
		theme: z.enum(StatusPageThemes).optional(),
		themeMode: z.enum(StatusPageThemeModes).optional(),
	})
	.strip();

export const imageValidation = z
	.object({
		fieldname: z.string().min(1, "Field name is required"),
		originalname: z.string().min(1, "Original name is required"),
		encoding: z.string().min(1, "Encoding is required"),
		mimetype: z.enum(ImageMimeTypes, {
			message: "File must be a valid image (jpeg, jpg, or png)",
		}),
		size: z.number().max(3145728, "File size must be less than 3MB"),
		buffer: z.instanceof(Buffer, { message: "Buffer is required" }),
		destination: z.string().optional(),
		filename: z.string().optional(),
		path: z.string().optional(),
	})
	.refine((data) => data.buffer, {
		message: "Image file is required",
	});

// Keep aligned with DailyCheckBucket in domain/checks/check.type.ts. avgResponseTime is null
// when no check that day recorded a response time ($avg skips missing, $round passes null through).
export const dailyCheckBucketResponseSchema = z.object({
	monitorId: z.string(),
	date: z.string(),
	totalChecks: z.number(),
	upChecks: z.number(),
	downChecks: z.number(),
	avgResponseTime: z.number().nullable(),
});

// Keep aligned with CheckSnapshot in domain/checks/check.type.ts.
export const checkSnapshotResponseSchema = z
	.object({
		id: z.string(),
		status: z.boolean(),
		responseTime: z.number(),
		statusCode: z.number(),
		message: z.string(),
		createdAt: z.string(),
		accessibility: z.number().optional(),
		bestPractices: z.number().optional(),
		seo: z.number().optional(),
		performance: z.number().optional(),
	})
	.passthrough();

// Status page entity as serialized by the repository. Keep aligned with StatusPage in
// domain/status-pages/status-page.type.ts.
export const statusPageResponseSchema = z.object({
	id: z.string(),
	userId: z.string(),
	teamId: z.string(),
	type: z.array(z.enum(StatusPageTypes)),
	companyName: z.string(),
	url: z.string(),
	customDomain: z.string().nullable().optional(),
	timezone: z.string().optional(),
	color: z.string(),
	monitors: z.array(z.string()),
	subMonitors: z.array(z.string()),
	originalMonitors: z.array(z.string()).optional(),
	logo: z.object({ data: z.string(), contentType: z.string() }).nullable().optional(),
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
});

// Keep aligned with PublicStatusPageMonitor in domain/status-pages/status-page.type.ts.
// url/port are present only when the showURL setting is enabled; dailyChecks only when range !== "latest".
export const publicStatusPageMonitorResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(MonitorTypes),
	status: z.enum(MonitorStatuses),
	uptimePercentage: z.number().optional(),
	recentChecks: z.array(checkSnapshotResponseSchema),
	url: z.string().optional(),
	port: z.number().optional(),
	dailyChecks: z.array(dailyCheckBucketResponseSchema).optional(),
});

// Response of the public status page endpoints. Keep aligned with PublicStatusPagePayload in
// domain/status-pages/status-page.type.ts; range, bucketTimezone, and checkTTLDays are present only when range !== "latest".
export const publicStatusPagePayloadResponseSchema = z.object({
	statusPage: statusPageResponseSchema,
	monitors: z.array(publicStatusPageMonitorResponseSchema),
	range: z.enum(StatusPageRanges).optional(),
	bucketTimezone: z.string().optional(),
	checkTTLDays: z.number().optional(),
});
