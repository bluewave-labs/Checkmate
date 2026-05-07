import { z } from "zod";
import { booleanCoercion } from "./shared.js";

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
		durationUnit: z.enum(["seconds", "minutes", "hours", "days"]),
		start: dateToString,
		end: dateToString,
		repeat: z.number().min(0, "Repeat must be a non-negative number"),
	})
	.strict()
	.refine((data) => new Date(data.end).getTime() > new Date(data.start).getTime(), {
		message: "End must be after start",
		path: ["end"],
	})
	.refine((data) => data.repeat > 0 || new Date(data.end).getTime() > Date.now(), {
		message: "End must be in the future for one-time maintenance windows",
		path: ["end"],
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
		durationUnit: z.enum(["seconds", "minutes", "hours", "days"]).optional(),
	})
	.strict()
	.refine((data) => !data.start || !data.end || new Date(data.end).getTime() > new Date(data.start).getTime(), {
		message: "End must be after start",
		path: ["end"],
	});
