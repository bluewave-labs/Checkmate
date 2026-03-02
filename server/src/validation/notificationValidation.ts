import joi from "joi";
import { z } from "zod";

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

export const sendTestEmailBodyValidation = z.object({
	to: z.string().min(1, "To field is required"),
	systemEmailHost: z.string().optional(),
	systemEmailPort: z.number().optional(),
	systemEmailSecure: z.boolean().optional(),
	systemEmailPool: z.boolean().optional(),
	systemEmailAddress: z.string().optional(),
	systemEmailPassword: z.string().optional(),
	systemEmailUser: z.string().optional(),
	systemEmailConnectionHost: z.union([z.string(), z.literal("")]).optional(),
	systemEmailIgnoreTLS: z.boolean().optional(),
	systemEmailRequireTLS: z.boolean().optional(),
	systemEmailRejectUnauthorized: z.boolean().optional(),
	systemEmailTLSServername: z.union([z.string(), z.literal("")]).optional(),
});
