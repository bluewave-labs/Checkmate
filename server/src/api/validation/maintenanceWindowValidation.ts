import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { DurationUnits } from "@/domain/maintenance-windows/maintenance-window.type.js";
import { SortOrders } from "@/types/query.js";

const dateToString = z.coerce.date().transform((d) => d.toISOString());

//****************************************
// Maintenance Window Validations
//****************************************

export const createMaintenanceWindowBodyValidation = z
	.object({
		monitors: z.array(z.string()).default([]),
		tags: z.array(z.string()).default([]),
		name: z.string().min(1, "Name is required"),
		active: z.boolean().optional(),
		duration: z.number().min(1, "Duration is required"),
		durationUnit: z.enum(DurationUnits),
		start: dateToString,
		end: dateToString,
		repeat: z.number().min(0, "Repeat must be a non-negative number"),
		expiry: dateToString.optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (data.monitors.length === 0 && data.tags.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "At least one monitor or tag is required",
				path: ["monitors"],
			});
		}
		const start = new Date(data.start).getTime();
		const end = new Date(data.end).getTime();
		if (end <= start) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End must be after start",
				path: ["end"],
			});
		}
		if (data.repeat === 0 && end <= Date.now()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "End must be in the future for one-time maintenance windows",
				path: ["end"],
			});
		}
	});

export const getMaintenanceWindowByIdParamValidation = z.object({
	id: z.string().min(1, "ID is required"),
});

export const getMaintenanceWindowsByTeamIdQueryValidation = z.object({
	active: booleanCoercion.optional(),
	page: z.coerce.number().optional(),
	rowsPerPage: z.coerce.number().optional(),
	field: z.string().optional(),
	order: z.enum(SortOrders).optional(),
});

export const getMaintenanceWindowsByMonitorIdParamValidation = z.object({
	monitorId: z.string().min(1, "Monitor ID is required"),
});

export const deleteMaintenanceWindowByIdParamValidation = z.object({
	id: z.string().min(1, "ID is required"),
});

export const editMaintenanceWindowByIdParamValidation = z.object({
	id: z.string().min(1, "ID is required"),
});

export const editMaintenanceByIdWindowBodyValidation = z
	.object({
		active: z.boolean().optional(),
		name: z.string().optional(),
		repeat: z.number().optional(),
		start: dateToString.optional(),
		end: dateToString.optional(),
		expiry: dateToString.optional(),
		monitors: z.array(z.string()).optional(),
		tags: z.array(z.string()).optional(),
		duration: z.number().optional(),
		durationUnit: z.enum(DurationUnits).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (data.monitors !== undefined && data.tags !== undefined && data.monitors.length === 0 && data.tags.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "At least one monitor or tag is required",
				path: ["monitors"],
			});
		}
		if (data.start && data.end) {
			const start = new Date(data.start).getTime();
			const end = new Date(data.end).getTime();
			if (end <= start) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "End must be after start",
					path: ["end"],
				});
			}
		}
	});
