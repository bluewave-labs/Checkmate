import { z } from "zod";

//****************************************
// Maintenance Window Validations
//****************************************

export const createMaintenanceWindowBodyValidation = z.object({
	monitors: z.array(z.string()).min(1, "At least one monitor is required"),
	name: z.string().min(1, "Name is required"),
	active: z.boolean().optional(),
	duration: z.number().min(1, "Duration is required"),
	durationUnit: z.enum(["seconds", "minutes", "hours", "days"]),
	start: z.coerce.date(),
	end: z.coerce.date(),
	repeat: z.number().min(0, "Repeat must be a non-negative number"),
	expiry: z.coerce.date().optional(),
});

export const getMaintenanceWindowByIdParamValidation = z.object({
	id: z.string().min(1, "ID is required"),
});

export const getMaintenanceWindowsByTeamIdQueryValidation = z.object({
	active: z.coerce.boolean().optional(),
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

export const editMaintenanceByIdWindowBodyValidation = z.object({
	active: z.boolean().optional(),
	name: z.string().optional(),
	repeat: z.number().optional(),
	start: z.coerce.date().optional(),
	end: z.coerce.date().optional(),
	expiry: z.coerce.date().optional(),
	monitors: z.array(z.unknown()).optional(),
	duration: z.number().optional(),
	durationUnit: z.enum(["seconds", "minutes", "hours", "days"]).optional(),
});
