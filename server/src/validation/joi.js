import joi from "joi";
import { ROLES, VALID_ROLES } from "../utils/roleUtils.js";

//****************************************
// Custom Validators
//****************************************

const roleValidatior = (role) => (value, helpers) => {
	const hasRole = role.some((role) => value.includes(role));
	if (!hasRole) {
		throw new joi.ValidationError(`You do not have the required authorization. Required roles: ${role.join(", ")}`);
	}
	return value;
};

//****************************************
// Auth
//****************************************

const passwordPattern =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/])[A-Za-z0-9!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]+$/;

const loginValidation = joi.object({
	email: joi.string().email().required().lowercase(),
	password: joi.string().required(),
});
const nameValidation = joi
	.string()
	.trim()
	.max(50)
	.pattern(/^(?=.*[\p{L}\p{Sc}])[\p{L}\p{Sc}\s'\-().]+$/u)
	.messages({
		"string.empty": "Name is required",
		"string.max": "Name must be less than 50 characters",
		"string.pattern.base":
			"Names must contain at least 1 letter and may only include letters, currency symbols, spaces, apostrophes, hyphens (-), periods (.), and parentheses ().",
	});

const registrationBodyValidation = joi.object({
	firstName: nameValidation.required(),
	lastName: nameValidation.required(),
	email: joi
		.string()
		.email()
		.required()
		.custom((value, helpers) => {
			const lowercasedValue = value.toLowerCase();
			if (value !== lowercasedValue) {
				return helpers.message("Email must be in lowercase");
			}
			return lowercasedValue;
		}),
	password: joi.string().min(8).required().pattern(passwordPattern),
	profileImage: joi.any(),
	role: joi.array().items(joi.string().valid("superadmin", "admin", "user", "demo")),
	teamId: joi.string().allow("").required(),
	inviteToken: joi.string().allow("").required(),
});

const editUserBodyValidation = joi.object({
	firstName: nameValidation.optional(),
	lastName: nameValidation.optional(),
	profileImage: joi.any(),
	newPassword: joi.string().min(8).pattern(passwordPattern),
	password: joi.string().min(8).pattern(passwordPattern),
	deleteProfileImage: joi.boolean(),
});

const recoveryValidation = joi.object({
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required(),
});

const recoveryTokenBodyValidation = joi.object({
	recoveryToken: joi.string().required(),
});

const newPasswordValidation = joi.object({
	recoveryToken: joi.string().required(),
	password: joi.string().min(8).required().pattern(passwordPattern),
	confirm: joi.string(),
});

const deleteUserParamValidation = joi.object({
	email: joi.string().email().required(),
});

const inviteBodyValidation = joi.object({
	email: joi.string().trim().email().required().messages({
		"string.empty": "Email is required",
		"string.email": "Must be a valid email address",
	}),
	role: joi.array().required(),
	teamId: joi.string().required(),
});

const inviteVerificationBodyValidation = joi.object({
	token: joi.string().required(),
});

//****************************************
// Monitors
//****************************************

const getMonitorByIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getMonitorByIdQueryValidation = joi.object({
	status: joi.boolean(),
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
	numToDisplay: joi.number(),
	normalize: joi.boolean(),
});

const getMonitorsByTeamIdParamValidation = joi.object({});

const getMonitorsByTeamIdQueryValidation = joi.object({
	limit: joi.number(),
	type: joi
		.alternatives()
		.try(
			joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game"),
			joi.array().items(joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port", "game"))
		),
	page: joi.number(),
	rowsPerPage: joi.number(),
	filter: joi.string(),
	field: joi.string(),
	order: joi.string().valid("asc", "desc"),
});

const getMonitorStatsByIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});
const getMonitorStatsByIdQueryValidation = joi.object({
	status: joi.string(),
	limit: joi.number(),
	sortOrder: joi.string().valid("asc", "desc"),
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
	numToDisplay: joi.number(),
	normalize: joi.boolean(),
});

const getCertificateParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const createMonitorBodyValidation = joi.object({
	_id: joi.string(),
	name: joi.string().required(),
	description: joi.string().required(),
	type: joi.string().required(),
	statusWindowSize: joi.number().min(1).max(20).default(5),
	statusWindowThreshold: joi.number().min(1).max(100).default(60),
	url: joi.string().required(),
	ignoreTlsErrors: joi.boolean().default(false),
	port: joi.number(),
	isActive: joi.boolean(),
	interval: joi.number(),
	thresholds: joi.object().keys({
		usage_cpu: joi.number(),
		usage_memory: joi.number(),
		usage_disk: joi.number(),
		usage_temperature: joi.number(),
	}),
	notifications: joi.array().items(joi.string()),
	secret: joi.string(),
	jsonPath: joi.string().allow(""),
	expectedValue: joi.string().allow(""),
	matchMethod: joi.string(),
	gameId: joi.string().allow(""),
});

const createMonitorsBodyValidation = joi.array().items(
	createMonitorBodyValidation.keys({
		userId: joi.string().required(),
		teamId: joi.string().required(),
	})
);

const editMonitorBodyValidation = joi.object({
	name: joi.string(),
	statusWindowSize: joi.number().min(1).max(20).default(5),
	statusWindowThreshold: joi.number().min(1).max(100).default(60),
	description: joi.string(),
	interval: joi.number(),
	notifications: joi.array().items(joi.string()),
	secret: joi.string(),
	ignoreTlsErrors: joi.boolean(),
	jsonPath: joi.string().allow(""),
	expectedValue: joi.string().allow(""),
	matchMethod: joi.string().allow(null, ""),
	port: joi.number().min(1).max(65535),
	thresholds: joi.object().keys({
		usage_cpu: joi.number(),
		usage_memory: joi.number(),
		usage_disk: joi.number(),
		usage_temperature: joi.number(),
	}),
	gameId: joi.string(),
});

const pauseMonitorParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getMonitorURLByQueryValidation = joi.object({
	monitorURL: joi.string().uri().required(),
});

const getHardwareDetailsByIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getHardwareDetailsByIdQueryValidation = joi.object({
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
});

//****************************************
// Alerts
//****************************************

const createAlertParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const createAlertBodyValidation = joi.object({
	checkId: joi.string().required(),
	monitorId: joi.string().required(),
	userId: joi.string().required(),
	status: joi.boolean(),
	message: joi.string(),
	notifiedStatus: joi.boolean(),
	acknowledgeStatus: joi.boolean(),
});

const getAlertsByUserIdParamValidation = joi.object({
	userId: joi.string().required(),
});

const getAlertsByMonitorIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getAlertByIdParamValidation = joi.object({
	alertId: joi.string().required(),
});

const editAlertParamValidation = joi.object({
	alertId: joi.string().required(),
});

const editAlertBodyValidation = joi.object({
	status: joi.boolean(),
	message: joi.string(),
	notifiedStatus: joi.boolean(),
	acknowledgeStatus: joi.boolean(),
});

const deleteAlertParamValidation = joi.object({
	alertId: joi.string().required(),
});

//****************************************
// Checks
//****************************************

const createCheckParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const createCheckBodyValidation = joi.object({
	monitorId: joi.string().required(),
	status: joi.boolean().required(),
	responseTime: joi.number().required(),
	statusCode: joi.number().required(),
	message: joi.string().required(),
});

const ackCheckBodyValidation = joi.object({
	ack: joi.boolean(),
});

const ackAllChecksParamValidation = joi.object({
	monitorId: joi.string().optional(),
	path: joi.string().valid("monitor", "team").required(),
});

const ackAllChecksBodyValidation = joi.object({
	ack: joi.boolean(),
});

const getChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getChecksQueryValidation = joi.object({
	type: joi.string().valid("http", "ping", "pagespeed", "hardware", "docker", "port", "game"),
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("recent", "hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "down", "resolve"),
	ack: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
	status: joi.boolean(),
});

const getTeamChecksQueryValidation = joi.object({
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "down", "resolve"),
	ack: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
});

const deleteChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const deleteChecksByTeamIdParamValidation = joi.object({});

const updateChecksTTLBodyValidation = joi.object({
	ttl: joi.number().required(),
});

//****************************************
// PageSpeedCheckValidation
//****************************************

const getPageSpeedCheckParamValidation = joi.object({
	monitorId: joi.string().required(),
});

//Validation schema for the monitorId parameter
const createPageSpeedCheckParamValidation = joi.object({
	monitorId: joi.string().required(),
});

//Validation schema for the monitorId body
const createPageSpeedCheckBodyValidation = joi.object({
	url: joi.string().required(),
});

const deletePageSpeedCheckParamValidation = joi.object({
	monitorId: joi.string().required(),
});

//****************************************
// MaintenanceWindowValidation
//****************************************

const createMaintenanceWindowBodyValidation = joi.object({
	monitors: joi.array().items(joi.string()).required(),
	name: joi.string().required(),
	active: joi.boolean(),
	start: joi.date().required(),
	end: joi.date().required(),
	repeat: joi.number().required(),
	expiry: joi.date(),
});

const getMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

const getMaintenanceWindowsByTeamIdQueryValidation = joi.object({
	active: joi.boolean(),
	page: joi.number(),
	rowsPerPage: joi.number(),
	field: joi.string(),
	order: joi.string().valid("asc", "desc"),
});

const getMaintenanceWindowsByMonitorIdParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const deleteMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

const editMaintenanceWindowByIdParamValidation = joi.object({
	id: joi.string().required(),
});

const editMaintenanceByIdWindowBodyValidation = joi.object({
	active: joi.boolean(),
	name: joi.string(),
	repeat: joi.number(),
	start: joi.date(),
	end: joi.date(),
	expiry: joi.date(),
	monitors: joi.array(),
});

//****************************************
// SettingsValidation
//****************************************
const updateAppSettingsBodyValidation = joi.object({
	checkTTL: joi.number().allow(""),
	pagespeedApiKey: joi.string().allow(""),
	language: joi.string().allow(""),
	timezone: joi.string().allow(""),
	// showURL: joi.bool().required(),
	systemEmailHost: joi.string().allow(""),
	systemEmailPort: joi.number().allow(""),
	systemEmailAddress: joi.string().allow(""),
	systemEmailPassword: joi.string().allow(""),
	systemEmailUser: joi.string().allow(""),
	systemEmailConnectionHost: joi.string().allow("").optional(),
	systemEmailTLSServername: joi.string().allow("").optional(),
	systemEmailSecure: joi.boolean(),
	systemEmailPool: joi.boolean(),
	systemEmailIgnoreTLS: joi.boolean(),
	systemEmailRequireTLS: joi.boolean(),
	systemEmailRejectUnauthorized: joi.boolean(),

	globalThresholds: joi
		.object({
			cpu: joi.number().min(1).max(100).allow("").optional(),
			memory: joi.number().min(1).max(100).allow("").optional(),
			disk: joi.number().min(1).max(100).allow("").optional(),
			temperature: joi.number().min(1).max(150).allow("").optional(),
		})
		.optional(),
});

//****************************************
// Status Page Validation
//****************************************

const getStatusPageParamValidation = joi.object({
	url: joi.string().required(),
});

const getStatusPageQueryValidation = joi.object({
	type: joi.string().valid("uptime").required(),
	timeFrame: joi.number().optional(),
});

const createStatusPageBodyValidation = joi.object({
	type: joi.string().valid("uptime").required(),
	companyName: joi.string().required(),
	url: joi
		.string()
		.pattern(/^[a-zA-Z0-9_-]+$/) // Only allow alphanumeric, underscore, and hyphen
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
});

const imageValidation = joi
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

const webhookConfigValidation = joi
	.object({
		webhookUrl: joi
			.string()
			.uri()
			.when("$platform", {
				switch: [
					{
						is: "telegram",
						then: joi.optional(),
					},
					{
						is: "discord",
						then: joi.required().messages({
							"string.empty": "Discord webhook URL is required",
							"string.uri": "Discord webhook URL must be a valid URL",
							"any.required": "Discord webhook URL is required",
						}),
					},
					{
						is: "slack",
						then: joi.required().messages({
							"string.empty": "Slack webhook URL is required",
							"string.uri": "Slack webhook URL must be a valid URL",
							"any.required": "Slack webhook URL is required",
						}),
					},
				],
			}),
		botToken: joi.string().when("$platform", {
			is: "telegram",
			then: joi.required().messages({
				"string.empty": "Telegram bot token is required",
				"any.required": "Telegram bot token is required",
			}),
			otherwise: joi.optional(),
		}),
		chatId: joi.string().when("$platform", {
			is: "telegram",
			then: joi.required().messages({
				"string.empty": "Telegram chat ID is required",
				"any.required": "Telegram chat ID is required",
			}),
			otherwise: joi.optional(),
		}),
	})
	.required();

const triggerNotificationBodyValidation = joi.object({
	monitorId: joi.string().required().messages({
		"string.empty": "Monitor ID is required",
		"any.required": "Monitor ID is required",
	}),
	type: joi.string().valid("webhook").required().messages({
		"string.empty": "Notification type is required",
		"any.required": "Notification type is required",
		"any.only": "Notification type must be webhook",
	}),
	platform: joi.string().valid("telegram", "discord", "slack").required().messages({
		"string.empty": "Platform type is required",
		"any.required": "Platform type is required",
		"any.only": "Platform must be telegram, discord, or slack",
	}),
	config: webhookConfigValidation.required().messages({
		"any.required": "Webhook configuration is required",
	}),
});

const createNotificationBodyValidation = joi.object({
	notificationName: joi.string().required().messages({
		"string.empty": "Notification name is required",
		"any.required": "Notification name is required",
	}),

	type: joi.string().valid("email", "webhook", "slack", "discord", "pager_duty").required().messages({
		"string.empty": "Notification type is required",
		"any.required": "Notification type is required",
		"any.only": "Notification type must be email, webhook, or pager_duty",
	}),

	address: joi.when("type", {
		is: "email",
		then: joi.string().email().required().messages({
			"string.empty": "E-mail address cannot be empty",
			"any.required": "E-mail address is required",
			"string.email": "Please enter a valid e-mail address",
		}),
		otherwise: joi.string().uri().required().messages({
			"string.empty": "Webhook URL cannot be empty",
			"any.required": "Webhook URL is required",
			"string.uri": "Please enter a valid Webhook URL",
		}),
	}),
});

//****************************************
// Announcetment Page Validation
//****************************************

const createAnnouncementValidation = joi.object({
	title: joi.string().required().messages({
		"string.empty": "Title cannot be empty",
		"any.required": "Title is required",
	}),
	message: joi.string().required().messages({
		"string.empty": "Message cannot be empty",
		"any.required": "Message is required",
	}),
	userId: joi.string().required(),
});

const sendTestEmailBodyValidation = joi.object({
	to: joi.string().required(),
	systemEmailHost: joi.string(),
	systemEmailPort: joi.number(),
	systemEmailSecure: joi.boolean(),
	systemEmailPool: joi.boolean(),
	systemEmailAddress: joi.string(),
	systemEmailPassword: joi.string(),
	systemEmailUser: joi.string(),
	systemEmailConnectionHost: joi.string().allow("").optional(),
	systemEmailIgnoreTLS: joi.boolean(),
	systemEmailRequireTLS: joi.boolean(),
	systemEmailRejectUnauthorized: joi.boolean(),
	systemEmailTLSServername: joi.string().allow("").optional(),
});

const getUserByIdParamValidation = joi.object({
	userId: joi.string().required(),
});

const editUserByIdParamValidation = joi.object({
	userId: joi.string().required(),
});

const editUserByIdBodyValidation = joi.object({
	firstName: nameValidation.required(),
	lastName: nameValidation.required(),
	email: joi.string().email().required(),
	role: joi
		.array()
		.items(joi.string().valid(...VALID_ROLES))
		.min(1)
		.required(),
});

const editSuperadminUserByIdBodyValidation = joi.object({
	firstName: nameValidation.required(),
	lastName: nameValidation.required(),
	email: joi.string().email().required(),
	role: joi
		.array()
		.items(joi.string().valid(...VALID_ROLES, ROLES.SUPERADMIN))
		.min(1)
		.required(),
});

export {
	roleValidatior,
	loginValidation,
	registrationBodyValidation,
	recoveryValidation,
	recoveryTokenBodyValidation,
	newPasswordValidation,
	inviteBodyValidation,
	inviteVerificationBodyValidation,
	createMonitorBodyValidation,
	createMonitorsBodyValidation,
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdParamValidation,
	getMonitorsByTeamIdQueryValidation,
	getMonitorStatsByIdParamValidation,
	getMonitorStatsByIdQueryValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
	getCertificateParamValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getMonitorURLByQueryValidation,
	editUserBodyValidation,
	createAlertParamValidation,
	createAlertBodyValidation,
	getAlertsByUserIdParamValidation,
	getAlertsByMonitorIdParamValidation,
	getAlertByIdParamValidation,
	editAlertParamValidation,
	editAlertBodyValidation,
	deleteAlertParamValidation,
	createCheckParamValidation,
	createCheckBodyValidation,
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	ackCheckBodyValidation,
	ackAllChecksParamValidation,
	ackAllChecksBodyValidation,
	deleteChecksParamValidation,
	deleteChecksByTeamIdParamValidation,
	updateChecksTTLBodyValidation,
	deleteUserParamValidation,
	getPageSpeedCheckParamValidation,
	createPageSpeedCheckParamValidation,
	deletePageSpeedCheckParamValidation,
	createPageSpeedCheckBodyValidation,
	createMaintenanceWindowBodyValidation,
	getMaintenanceWindowByIdParamValidation,
	getMaintenanceWindowsByTeamIdQueryValidation,
	getMaintenanceWindowsByMonitorIdParamValidation,
	deleteMaintenanceWindowByIdParamValidation,
	editMaintenanceWindowByIdParamValidation,
	editMaintenanceByIdWindowBodyValidation,
	updateAppSettingsBodyValidation,
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
	triggerNotificationBodyValidation,
	createNotificationBodyValidation,
	webhookConfigValidation,
	createAnnouncementValidation,
	sendTestEmailBodyValidation,
	getUserByIdParamValidation,
	editUserByIdParamValidation,
	editUserByIdBodyValidation,
	editSuperadminUserByIdBodyValidation,
};
