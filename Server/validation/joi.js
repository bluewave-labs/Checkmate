import joi from "joi";

//****************************************
// Custom Validators
//****************************************

const roleValidatior = (role) => (value, helpers) => {
	const hasRole = role.some((role) => value.includes(role));
	if (!hasRole) {
		throw new joi.ValidationError(
			`You do not have the required authorization. Required roles: ${role.join(", ")}`
		);
	}
	return value;
};

//****************************************
// Auth
//****************************************

const passwordPattern =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/])[A-Za-z0-9!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]+$/;

const loginValidation = joi.object({
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
});

const registrationBodyValidation = joi.object({
	firstName: joi
		.string()
		.required()
		.pattern(/^[A-Za-z]+$/),
	lastName: joi
		.string()
		.required()
		.pattern(/^[A-Za-z]+$/),
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
	role: joi
		.array()
		.items(joi.string().valid("superadmin", "admin", "user", "demo"))
		.min(1)
		.required(),
	teamId: joi.string().allow("").required(),
	inviteToken: joi.string().allow("").required(),
});

const editUserParamValidation = joi.object({
	userId: joi.string().required(),
});

const editUserBodyValidation = joi.object({
	firstName: joi.string().pattern(/^[A-Za-z]+$/),
	lastName: joi.string().pattern(/^[A-Za-z]+$/),
	profileImage: joi.any(),
	newPassword: joi.string().min(8).pattern(passwordPattern),
	password: joi.string().min(8).pattern(passwordPattern),
	deleteProfileImage: joi.boolean(),
	role: joi.array(),
});

const recoveryValidation = joi.object({
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required(),
});

const recoveryTokenValidation = joi.object({
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

const inviteRoleValidation = joi.object({
	roles: joi.custom(roleValidatior(["admin", "superadmin"])).required(),
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

const getMonitorsByTeamIdParamValidation = joi.object({
	teamId: joi.string().required(),
});

const getMonitorsByTeamIdQueryValidation = joi.object({
	limit: joi.number(),
	type: joi
		.alternatives()
		.try(
			joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port"),
			joi
				.array()
				.items(
					joi.string().valid("http", "ping", "pagespeed", "docker", "hardware", "port")
				)
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
	userId: joi.string().required(),
	teamId: joi.string().required(),
	name: joi.string().required(),
	description: joi.string().required(),
	type: joi.string().required(),
	url: joi.string().required(),
	port: joi.number(),
	isActive: joi.boolean(),
	interval: joi.number(),
	thresholds: joi.object().keys({
		usage_cpu: joi.number(),
		usage_memory: joi.number(),
		usage_disk: joi.number(),
		usage_temperature: joi.number(),
	}),
	notifications: joi.array().items(joi.object()),
	secret: joi.string(),
	jsonPath: joi.string(),
	expectedValue: joi.string(),
	matchMethod: joi.string(),
});

const editMonitorBodyValidation = joi.object({
	name: joi.string(),
	description: joi.string(),
	interval: joi.number(),
	notifications: joi.array().items(joi.object()),
	secret: joi.string(),
	jsonPath: joi.string(),
	expectedValue: joi.string(),
	matchMethod: joi.string(),
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
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
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

const getChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const getChecksQueryValidation = joi.object({
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "down", "resolve"),
	page: joi.number(),
	rowsPerPage: joi.number(),
	status: joi.boolean(),
});

const getTeamChecksParamValidation = joi.object({
	teamId: joi.string().required(),
});

const getTeamChecksQueryValidation = joi.object({
	sortOrder: joi.string().valid("asc", "desc"),
	limit: joi.number(),
	dateRange: joi.string().valid("hour", "day", "week", "month", "all"),
	filter: joi.string().valid("all", "down", "resolve"),
	page: joi.number(),
	rowsPerPage: joi.number(),
	status: joi.boolean(),
});

const deleteChecksParamValidation = joi.object({
	monitorId: joi.string().required(),
});

const deleteChecksByTeamIdParamValidation = joi.object({
	teamId: joi.string().required(),
});

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
	apiBaseUrl: joi.string().allow(""),
	logLevel: joi.string().valid("debug", "none", "error", "warn").allow(""),
	clientHost: joi.string().allow(""),
	dbType: joi.string().allow(""),
	dbConnectionString: joi.string().allow(""),
	redisHost: joi.string().allow(""),
	redisPort: joi.number().allow(null, ""),
	redisUser: joi.string().allow(null, ""),
	redisPassword: joi.string().allow(null, ""),
	redisDb: joi.number().allow(null, 0),
	redisPrefix: joi.string().allow(""),
	jwtTTL: joi.string().allow(""),
	pagespeedApiKey: joi.string().allow(""),
	systemEmailHost: joi.string().allow(""),
	systemEmailPort: joi.number().allow(""),
	systemEmailAddress: joi.string().allow(""),
	systemEmailPassword: joi.string().allow(""),
});

//****************************************
// Status Page Validation
//****************************************

const getStatusPageParamValidation = joi.object({
	url: joi.string().required(),
});

const getStatusPageQueryValidation = joi.object({
	type: joi.string().valid("uptime", "distributed").required(),
});

const createStatusPageBodyValidation = joi.object({
	userId: joi.string().required(),
	teamId: joi.string().required(),
	type: joi.string().valid("uptime", "distributed").required(),
	companyName: joi.string().required(),
	url: joi.string().required(),
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
	isPublished: joi.boolean(),
	showCharts: joi.boolean().optional(),
	showUptimePercentage: joi.boolean(),
});

const imageValidation = joi
	.object({
		fieldname: joi.string().required(),
		originalname: joi.string().required(),
		encoding: joi.string().required(),
		mimetype: joi
			.string()
			.valid("image/jpeg", "image/png", "image/jpg")
			.required()
			.messages({
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

export {
	roleValidatior,
	loginValidation,
	registrationBodyValidation,
	recoveryValidation,
	recoveryTokenValidation,
	newPasswordValidation,
	inviteRoleValidation,
	inviteBodyValidation,
	inviteVerificationBodyValidation,
	createMonitorBodyValidation,
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
	editUserParamValidation,
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
	getTeamChecksParamValidation,
	getTeamChecksQueryValidation,
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
};
