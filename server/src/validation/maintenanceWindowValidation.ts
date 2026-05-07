import { z } from "zod";
import { booleanCoercion } from "./shared.js";
import { DurationUnits } from "@/types/maintenanceWindow.js";

const dateToString = z.coerce.date().transform((d) => d.toISOString());

//****************************************
// Maintenance Window Validations
//****************************************

export const createMaintenanceWindowBodyValidation = z
	.object({
		monitors: z.array(z.string()).min(1, "At least one monitor is required"),
		name: z.string().min(1, "Name is required"),
		active: z.boolean().optional(),
		duration: z.number().min(1, "Duration is required"),
		durationUnit: z.enum(DurationUnits),
		start: dateToString,
		end: dateToString,
		repeat: z.number().min(0, "Repeat must be a non-negative number"),
	})
	.strict()
	.superRefine((data, ctx) => {
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
	order: z.enum(["asc", "desc"]).optional(),
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
		monitors: z.array(z.string()).optional(),
		duration: z.number().optional(),
		durationUnit: z.enum(DurationUnits).optional(),
	})
	.strict()
	.superRefine((data, ctx) => {
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
