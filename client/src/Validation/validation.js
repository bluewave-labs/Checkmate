import joi from "joi";
import dayjs from "dayjs";

const THRESHOLD_COMMON_BASE_MSG = "Threshold must be a number.";

const nameSchema = joi
	.string()
	.max(50)
	.trim()
	.pattern(/^[\p{L}\p{M}''\- ]+$/u)
	.messages({
		"string.empty": "Name is required",
		"string.max": "Name must be less than 50 characters",
		"string.pattern.base":
			"Name must contain only letters, spaces, apostrophes, or hyphens",
	});

const lastnameSchema = joi
	.string()
	.max(50)
	.trim()
	.pattern(/^[\p{L}\p{M}''\- ]+$/u)
	.messages({
		"string.empty": "Surname is required",
		"string.max": "Surname must be less than 50 characters",
		"string.pattern.base":
			"Surname must contain only letters, spaces, apostrophes, or hyphens",
	});

const passwordSchema = joi
	.string()
	.trim()
	.min(8)
	.custom((value, helpers) => {
		if (!/[A-Z]/.test(value)) {
			return helpers.error("uppercase");
		}
		return value;
	})
	.custom((value, helpers) => {
		if (!/[a-z]/.test(value)) {
			return helpers.error("lowercase");
		}
		return value;
	})
	.custom((value, helpers) => {
		if (!/\d/.test(value)) {
			return helpers.error("number");
		}
		return value;
	})
	.custom((value, helpers) => {
		if (!/[!?@#$%^&*()\-_=+[\]{};:'",.<>~`|\\/]/.test(value)) {
			return helpers.error("special");
		}
		return value;
	})
	.messages({
		"string.empty": "Password is required",
		"string.min": "Password must be at least 8 characters long",
		uppercase: "Password must contain at least one uppercase letter",
		lowercase: "Password must contain at least one lowercase letter",
		number: "Password must contain at least one number",
		special: "Password must contain at least one special character",
	});

const credentials = joi.object({
	firstName: nameSchema,
	lastName: lastnameSchema,
	email: joi
		.string()
		.trim()
		.email({ tlds: { allow: false } })
		.lowercase()
		.messages({
			"string.empty": "authRegisterEmailRequired",
			"string.email": "authRegisterEmailInvalid",
		}),
	password: passwordSchema,
	newPassword: passwordSchema,
	confirm: joi
		.string()
		.trim()
		.custom((value, helpers) => {
			const { password } = helpers.prefs.context;
			if (value !== password) {
				return helpers.error("different");
			}
			return value;
		})
		.messages({
			"string.empty": "This field can't be empty",
			different: "Passwords do not match",
		}),
	role: joi.array(),
	teamId: joi.string().allow("").optional(),
	inviteToken: joi.string().allow(""),
});

const monitorValidation = joi.object({
	url: joi.when("type", {
		is: "docker",
		then: joi
			.string()
			.trim()
			.regex(/^[a-z0-9]{64}$/)
			.messages({
				"string.empty": "This field is required.",
				"string.pattern.base": "Please enter a valid 64-character Docker container ID.",
			}),
		otherwise: joi
			.string()
			.trim()
			.custom((value, helpers) => {
				// Regex from https://gist.github.com/dperini/729294
				var urlRegex = new RegExp(
					"^" +
						// protocol identifier (optional)
						// short syntax // still required
						"(?:(?:https?|ftp):\\/\\/)?" +
						// user:pass BasicAuth (optional)
						"(?:" +
						// IP address dotted notation octets
						// excludes loopback network 0.0.0.0
						// excludes reserved space >= 224.0.0.0
						// excludes network & broadcast addresses
						// (first & last IP address of each class)
						"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
						"(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
						"(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
						"|" +
						// host & domain names, may end with dot
						// can be replaced by a shortest alternative
						// (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
						"(?:" +
						"(?:" +
						"[a-z0-9\\u00a1-\\uffff]" +
						"[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
						")?" +
						"[a-z0-9\\u00a1-\\uffff]\\." +
						")+" +
						// TLD identifier name, may end with dot
						"(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
						")" +
						// port number (optional)
						"(?::\\d{2,5})?" +
						// resource path (optional)
						"(?:[/?#]\\S*)?" +
						"$",
					"i"
				);
				if (!urlRegex.test(value)) {
					return helpers.error("string.invalidUrl");
				}

				return value;
			})
			.messages({
				"string.empty": "This field is required.",
				"string.uri": "The URL you provided is not valid.",
				"string.invalidUrl": "Please enter a valid URL with optional port",
			}),
	}),
	port: joi
		.number()
		.integer()
		.min(1)
		.max(65535)
		.when("type", {
			is: "port",
			then: joi.number().messages({
				"number.base": "Port must be a number.",
				"number.min": "Port must be at least 1.",
				"number.max": "Port must be at most 65535.",
				"any.required": "Port is required for port monitors.",
			}),
			otherwise: joi.optional(),
		}),
	name: joi.string().trim().max(50).allow("").messages({
		"string.max": "This field should not exceed the 50 characters limit.",
	}),
	type: joi.string().trim().messages({ "string.empty": "This field is required." }),
	ignoreTlsErrors: joi.boolean(),
	interval: joi.number().messages({
		"number.base": "Frequency must be a number.",
		"any.required": "Frequency is required.",
	}),
	expectedValue: joi.string().allow(""),
	jsonPath: joi.string().allow(""),
	matchMethod: joi.string(),
});

const imageValidation = joi.object({
	type: joi.string().valid("image/jpeg", "image/png").messages({
		"any.only": "Invalid file format.",
		"string.empty": "File type required.",
	}),
	size: joi
		.number()
		.max(3 * 1024 * 1024)
		.messages({
			"number.base": "File size must be a number.",
			"number.max": "File size must be less than 3 MB.",
			"number.empty": "File size required.",
		}),
});

const logoImageValidation = joi
	.object({
		src: joi.string(),
		name: joi.string(),
		type: joi
			.string()
			.valid("image/jpeg", "image/png")
			.allow(null) // Allow null and empty string
			.messages({
				"any.only": "Invalid file format.",
				"string.empty": "File type required.",
			})
			.optional(),
		size: joi
			.number()
			.max(3000000)
			.allow(null) // Allow null and empty string
			.messages({
				"number.base": "File size must be a number.",
				"number.max": "File size must be less than 3MB.",
				"number.empty": "File size required.",
			})
			.optional(),
	})
	.allow(null)
	.optional(); // Make entire object optional

const statusPageValidation = joi.object({
	type: joi.string().valid("uptime").required(),
	isPublished: joi.bool(),
	companyName: joi
		.string()
		.trim()
		.messages({ "string.empty": "Company name is required." }),
	url: joi
		.string()
		.pattern(/^[a-zA-Z0-9_-]+$/) // Only allow alphanumeric, underscore, and hyphen
		.required()
		.messages({
			"string.pattern.base":
				"URL can only contain letters, numbers, underscores, and hyphens",
		}),
	timezone: joi.string().trim().messages({ "string.empty": "Timezone is required." }),
	color: joi.string().trim().messages({ "string.empty": "Color is required." }),
	theme: joi.string(),
	monitors: joi.array().min(1).required().messages({
		"string.pattern.base": "Must be a valid monitor ID",
		"array.base": "Monitors must be an array",
		"array.min": "At least one monitor is required",
		"array.empty": "At least one monitor is required",
		"any.required": "At least one monitor is required",
	}),
	subMonitors: joi.array().optional(),
	logo: logoImageValidation,
	showUptimePercentage: joi.boolean(),
	showCharts: joi.boolean(),
});

const settingsValidation = joi.object({
	checkTTL: joi.number().required().messages({
		"string.empty": "Please enter a value",
		"number.base": "Please enter a valid number",
		"any.required": "Please enter a value",
	}),
	pagespeedApiKey: joi.string().allow("").optional(),
	language: joi.string().required(),
	timezone: joi.string().allow("").optional(),
	systemEmailHost: joi.string().allow(""),
	systemEmailPort: joi.number().allow(null, ""),
	systemEmailAddress: joi.string().allow(""),
	systemEmailPassword: joi.string().allow(""),
	systemEmailUser: joi.string().allow(""),
	systemEmailConnectionHost: joi.string().allow(""),
});

const dayjsValidator = (value, helpers) => {
	if (!dayjs(value).isValid()) {
		return helpers.error("any.invalid");
	}
	return value;
};

const maintenanceWindowValidation = joi.object({
	repeat: joi.string(),
	startDate: joi.custom(dayjsValidator, "Day.js date validation"),
	startTime: joi.custom(dayjsValidator, "Day.js date validation"),
	duration: joi.number().integer().min(0),
	durationUnit: joi.string(),
	name: joi.string(),
	monitors: joi.array().min(1),
});

const advancedSettingsValidation = joi.object({
	apiBaseUrl: joi.string().uri({ allowRelative: true }).trim().messages({
		"string.empty": "API base url is required.",
		"string.uri": "The URL you provided is not valid.",
	}),
	logLevel: joi.string().valid("debug", "none", "error", "warn").allow(""),
	systemEmailHost: joi.string().allow(""),
	systemEmailPort: joi.number().allow(null, ""),
	systemEmailAddress: joi.string().allow(""),
	systemEmailPassword: joi.string().allow(""),
	systemEmailConnectionHost: joi.string().allow(""),
	jwtTTLNum: joi.number().messages({
		"number.base": "JWT TTL is required.",
	}),
	jwtTTLUnits: joi
		.string()
		.trim()
		.custom((value, helpers) => {
			if (!["days", "hours"].includes(value)) {
				return helpers.message("JWT TTL unit is required.");
			}
			return value;
		}),
	dbType: joi.string().trim().messages({
		"string.empty": "DB type is required.",
	}),
	redisHost: joi.string().trim().messages({
		"string.empty": "Redis host is required.",
	}),
	redisPort: joi.number().allow(null, ""),
	pagespeedApiKey: joi.string().allow(""),
});

const infrastructureMonitorValidation = joi.object({
	url: joi
		.string()
		.trim()
		.custom((value, helpers) => {
			const urlRegex =
				/^(https?:\/\/)?(([0-9]{1,3}\.){3}[0-9]{1,3}|[\da-z\.-]+)(\.[a-z\.]{2,6})?(:(\d+))?([\/\w \.-]*)*\/?$/i;

			if (!urlRegex.test(value)) {
				return helpers.error("string.invalidUrl");
			}

			return value;
		})
		.messages({
			"string.empty": "This field is required.",
			"string.uri": "The URL you provided is not valid.",
			"string.invalidUrl": "Please enter a valid URL with optional port",
		}),
	name: joi.string().trim().max(50).allow("").messages({
		"string.max": "This field should not exceed the 50 characters limit.",
	}),
	secret: joi.string().trim().messages({ "string.empty": "This field is required." }),
	usage_cpu: joi.number().messages({
		"number.base": THRESHOLD_COMMON_BASE_MSG,
	}),
	cpu: joi.boolean(),
	memory: joi.boolean(),
	disk: joi.boolean(),
	temperature: joi.boolean(),
	usage_memory: joi.number().messages({
		"number.base": THRESHOLD_COMMON_BASE_MSG,
	}),
	usage_disk: joi.number().messages({
		"number.base": THRESHOLD_COMMON_BASE_MSG,
	}),
	usage_temperature: joi.number().messages({
		"number.base": "Temperature must be a number.",
	}),
	// usage_system: joi.number().messages({
	// 	"number.base": "System load must be a number.",
	// }),
	// usage_swap: joi.number().messages({
	// 	"number.base": "Swap used must be a number.",
	// }),
	interval: joi.number().messages({
		"number.base": "Frequency must be a number.",
		"any.required": "Frequency is required.",
	}),
	notifications: joi.array().items(
		joi.object({
			type: joi.string().valid("email").required(),
			address: joi
				.string()
				.email({ tlds: { allow: false } })
				.required(),
		})
	),
});

export {
	credentials,
	imageValidation,
	monitorValidation,
	settingsValidation,
	maintenanceWindowValidation,
	advancedSettingsValidation,
	infrastructureMonitorValidation,
	statusPageValidation,
	logoImageValidation,
};
