import joi from "joi";

//****************************************
// Notification Validations
//****************************************

export const createNotificationBodyValidation = joi.object({
	notificationName: joi.string().required().messages({
		"string.empty": "Notification name is required",
		"any.required": "Notification name is required",
	}),

	type: joi.string().valid("email", "webhook", "slack", "discord", "pager_duty", "matrix").required().messages({
		"string.empty": "Notification type is required",
		"any.required": "Notification type is required",
		"any.only": "Notification type must be email, webhook, slack, discord, pager_duty, or matrix",
	}),

	address: joi.when("type", {
		switch: [
			{
				is: "email",
				then: joi.string().email().required().messages({
					"string.empty": "E-mail address cannot be empty",
					"any.required": "E-mail address is required",
					"string.email": "Please enter a valid e-mail address",
				}),
			},
			{
				is: "pager_duty",
				then: joi.string().required().messages({
					"string.empty": "PagerDuty integration key cannot be empty",
					"any.required": "PagerDuty integration key is required",
				}),
			},
			{
				is: joi.string().valid("webhook", "slack", "discord"),
				then: joi.string().uri().required().messages({
					"string.empty": "Webhook URL cannot be empty",
					"any.required": "Webhook URL is required",
					"string.uri": "Please enter a valid Webhook URL",
				}),
			},
			{
				is: "matrix",
				then: joi.string().allow("").optional(),
			},
		],
	}),

	homeserverUrl: joi.when("type", {
		is: "matrix",
		then: joi.string().uri().required().messages({
			"string.empty": "Homeserver URL cannot be empty",
			"any.required": "Homeserver URL is required",
			"string.uri": "Please enter a valid Homeserver URL",
		}),
		otherwise: joi.string().allow("").optional(),
	}),

	roomId: joi.when("type", {
		is: "matrix",
		then: joi.string().required().messages({
			"string.empty": "Room ID cannot be empty",
			"any.required": "Room ID is required",
		}),
		otherwise: joi.string().allow("").optional(),
	}),

	accessToken: joi.when("type", {
		is: "matrix",
		then: joi.string().required().messages({
			"string.empty": "Access Token cannot be empty",
			"any.required": "Access Token is required",
		}),
		otherwise: joi.string().allow("").optional(),
	}),
});
