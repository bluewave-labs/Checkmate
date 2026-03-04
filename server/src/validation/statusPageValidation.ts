import { z } from "zod";
import { booleanCoercion } from "./shared.js";

//****************************************
// Status Page Validations
//****************************************

export const getStatusPageParamValidation = z.object({
	url: z.string().min(1, "URL is required"),
});

export const getStatusPageQueryValidation = z.object({
	type: z.literal("uptime"),
	timeFrame: z.coerce.number().optional(),
});

export const createStatusPageBodyValidation = z
	.object({
		type: z.literal("uptime"),
		companyName: z.string().min(1, "Company name is required"),
		url: z.string().regex(/^[a-zA-Z0-9_-]+$/, {
			message: "URL can only contain letters, numbers, underscores, and hyphens",
		}),
		timezone: z.string().optional(),
		color: z.string().optional(),
		monitors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Must be a valid monitor ID")).min(1, "At least one monitor is required"),
		subMonitors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
		deleteSubmonitors: z.boolean().optional(),
		isPublished: booleanCoercion,
		showCharts: booleanCoercion.optional(),
		showUptimePercentage: booleanCoercion,
		showAdminLoginLink: booleanCoercion.optional(),
		removeLogo: z.union([z.literal("true"), z.literal("false")]).optional(),
	})
	.strip();

export const imageValidation = z
	.object({
		fieldname: z.string().min(1, "Field name is required"),
		originalname: z.string().min(1, "Original name is required"),
		encoding: z.string().min(1, "Encoding is required"),
		mimetype: z.enum(["image/jpeg", "image/png", "image/jpg"], {
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
