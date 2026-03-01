import joi from "joi";

//****************************************
// Settings Validations
//****************************************

export const updateAppSettingsBodyValidation = joi.object({
	checkTTL: joi.number().allow(""),
	pagespeedApiKey: joi.string().allow(""),
	language: joi.string().allow(""),
	timezone: joi.string().allow(""),
	showURL: joi.bool().optional(),
	systemEmailHost: joi.string().allow(""),
	systemEmailPort: joi.number().allow(""),
	systemEmailAddress: joi.string().allow(""),
	systemEmailPassword: joi.string().allow(""),
	systemEmailUser: joi.string().allow(""),
	systemEmailConnectionHost: joi.string().allow(""),
	systemEmailTLSServername: joi.string().allow(""),
	systemEmailSecure: joi.boolean(),
	systemEmailPool: joi.boolean(),
	systemEmailIgnoreTLS: joi.boolean(),
	systemEmailRequireTLS: joi.boolean(),
	systemEmailRejectUnauthorized: joi.boolean(),

	globalThresholds: joi
		.object({
			cpu: joi.number().min(1).max(100).allow(""),
			memory: joi.number().min(1).max(100).allow(""),
			disk: joi.number().min(1).max(100).allow(""),
			temperature: joi.number().min(1).max(150).allow(""),
		})
		.optional(),
});
