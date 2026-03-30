import { z } from "zod";
import { MONITOR_DISPLAY_TYPES } from "@/Types/StatusPage";

export const statusPageSchema = z.object({
	companyName: z
		.string()
		.min(1, "Company name is required")
		.max(100, "Company name must be at most 100 characters"),
	url: z
		.string()
		.min(1, "URL is required")
		.max(50, "URL must be at most 50 characters")
		.regex(
			/^[a-z0-9-]+$/,
			"URL can only contain lowercase letters, numbers, and hyphens"
		),
	timezone: z.string().optional(),
	type: z.array(z.enum(MONITOR_DISPLAY_TYPES)).min(1, "At least one type is required"),
	color: z.string().min(1, "Color is required"),
	monitors: z.array(z.string()).min(1, "At least one monitor is required"),
	isPublished: z.boolean(),
	showCharts: z.boolean(),
	showUptimePercentage: z.boolean(),
	showAdminLoginLink: z.boolean(),
	showInfrastructure: z.boolean(),
	showPageSpeed: z.boolean(),
	customCSS: z.string().optional(),
	logo: z
		.object({
			data: z.string(),
			contentType: z.string(),
		})
		.nullable()
		.optional(),
});

export type StatusPageFormData = z.infer<typeof statusPageSchema>;
