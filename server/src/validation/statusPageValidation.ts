import joi from "joi";

//****************************************
// Status Page Validations
//****************************************

export const getStatusPageParamValidation = joi.object({
	url: joi.string().required(),
});

export const getStatusPageQueryValidation = joi.object({
	type: joi.string().valid("uptime").required(),
	timeFrame: joi.number().optional(),
});

export const createStatusPageBodyValidation = joi.object({
	type: joi.string().valid("uptime").required(),
	companyName: joi.string().required(),
	url: joi
		.string()
		.pattern(/^[a-zA-Z0-9_-]+$/)
		.required()
		.messages({
			"string.pattern.base": "URL can only contain letters, numbers, underscores, and hyphens",
		}),
	timezone: joi.string().optional(),
	color: joi.string().optional(),
	monitors: joi
		.array()
		.items(joi.string().pattern(/^[0-9a-fA-F]{24}$/))
		.required()
		.messages({
			"string.pattern.base": "Must be a valid monitor ID",
			"array.base": "Monitors must be an array",
			"array.empty": "At least one monitor is required",
			"any.required": "Monitors are required",
		}),
	subMonitors: joi
		.array()
		.items(joi.string().pattern(/^[0-9a-fA-F]{24}$/))
		.optional(),
	deleteSubmonitors: joi.boolean().optional(),
	isPublished: joi.boolean(),
	showCharts: joi.boolean().optional(),
	showUptimePercentage: joi.boolean(),
	showAdminLoginLink: joi.boolean().optional(),
	removeLogo: joi.string().valid("true", "false").optional(),
});

export const imageValidation = joi
	.object({
		fieldname: joi.string().required(),
		originalname: joi.string().required(),
		encoding: joi.string().required(),
		mimetype: joi.string().valid("image/jpeg", "image/png", "image/jpg").required().messages({
			"string.valid": "File must be a valid image (jpeg, jpg, or png)",
		}),
		size: joi.number().max(3145728).required().messages({
			"number.max": "File size must be less than 3MB",
		}),
		buffer: joi.binary().required(),
		destination: joi.string(),
		filename: joi.string(),
		path: joi.string(),
	})
	.messages({
		"any.required": "Image file is required",
	});
