import joi from "joi";

//****************************************
// Maintenance Window Validations
//****************************************

export const createMaintenanceWindowBodyValidation = joi.object({
	monitors: joi.array().items(joi.string()).required(),
	name: joi.string().required(),
	active: joi.boolean(),
	duration: joi.number().required(),
	durationUnit: joi.string().valid("seconds", "minutes", "hours", "days").required(),
	start: joi.date().required(),
	end: joi.date().required(),
	repeat: joi.number().required(),
	expiry: joi.date(),
});

export const getMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

export const getMaintenanceWindowsByTeamIdQueryValidation = joi.object({
	active: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
	field: joi.string(),
	order: joi.string().valid("asc", "desc"),
});

export const getMaintenanceWindowsByMonitorIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

export const deleteMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

export const editMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

export const editMaintenanceByIdWindowBodyValidation = joi.object({
	active: joi.boolean(),
	name: joi.string(),
	repeat: joi.number(),
	start: joi.date(),
	end: joi.date(),
	expiry: joi.date(),
	monitors: joi.array(),
	duration: joi.number(),
	durationUnit: joi.string().valid("seconds", "minutes", "hours", "days"),
});
