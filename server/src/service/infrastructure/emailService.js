const SERVICE_NAME = "EmailService";

/**
 * Represents an email service that can load templates, build, and send emails.
 */
class EmailService {
	static SERVICE_NAME = SERVICE_NAME;

	/**
	 * Constructs an instance of the EmailService, initializing template loaders and the email transporter.
	 * @param {Object} settingsService - The settings service to get email configuration.
	 * @param {Object} fs - The file system module.
	 * @param {Object} path - The path module.
	 * @param {Function} compile - The Handlebars compile function.
	 * @param {Function} mjml2html - The MJML to HTML conversion function.
	 * @param {Object} nodemailer - The nodemailer module.
	 * @param {Object} logger - The logger module.
	 */
	constructor(settingsService, fs, path, compile, mjml2html, nodemailer, logger) {
		this.settingsService = settingsService;
		this.fs = fs;
		this.path = path;
		this.compile = compile;
		this.mjml2html = mjml2html;
		this.nodemailer = nodemailer;
		this.logger = logger;
		this.init();
	}

	get serviceName() {
		return EmailService.SERVICE_NAME;
	}

	init = async () => {
		/**
		 * Loads an email template from the filesystem.
		 *
		 * @param {string} templateName - The name of the template to load.
		 * @returns {Function} A compiled template function that can be used to generate HTML email content.
		 */
		this.loadTemplate = (templateName) => {
			try {
				// Use EMAIL_TEMPLATE_PATH environment variable or default to src/templates/ in cwd
				const templateBase = process.env.EMAIL_TEMPLATE_PATH || this.path.join(process.cwd(), "src", "templates");
				const templatePath = this.path.join(templateBase, `${templateName}.mjml`);

				this.logger.debug({
					message: `Loading template: ${templateName}`,
					service: SERVICE_NAME,
					method: "loadTemplate",
					templatePath: templatePath,
				});

				const templateContent = this.fs.readFileSync(templatePath, "utf8");
				const compiled = this.compile(templateContent);

				this.logger.debug({
					message: `Template loaded successfully: ${templateName}`,
					service: SERVICE_NAME,
					method: "loadTemplate",
				});
				return compiled;
			} catch (error) {
				this.logger.error({
					message: `Failed to load template '${templateName}': ${error.message}`,
					service: SERVICE_NAME,
					method: "loadTemplate",
					templateName: templateName,
					error: error.message,
					stack: error.stack,
				});
				// Fail fast - throw error instead of returning empty function
				throw error;
			}
		};

		/**
		 * A lookup object to access preloaded email templates.
		 * @type {Object.<string, Function>}
		 * TODO  Load less used templates in their respective functions
		 */
		this.templateLookup = {
			welcomeEmailTemplate: this.loadTemplate("welcomeEmail"),
			employeeActivationTemplate: this.loadTemplate("employeeActivation"),
			noIncidentsThisWeekTemplate: this.loadTemplate("noIncidentsThisWeek"),
			serverIsDownTemplate: this.loadTemplate("serverIsDown"),
			serverIsUpTemplate: this.loadTemplate("serverIsUp"),
			passwordResetTemplate: this.loadTemplate("passwordReset"),
			hardwareIncidentTemplate: this.loadTemplate("hardwareIncident"),
			testEmailTemplate: this.loadTemplate("testEmailTemplate"),
		};

		/**
		 * The email transporter used to send emails.
		 * @type {Object}
		 */
	};

	buildEmail = async (template, context) => {
		try {
			if (!this.templateLookup[template]) {
				this.logger.error({
					message: `Template '${template}' not found in templateLookup`,
					service: SERVICE_NAME,
					method: "buildEmail",
					availableTemplates: Object.keys(this.templateLookup),
				});
				throw new Error(`Template '${template}' not found`);
			}
			if (typeof this.templateLookup[template] !== "function") {
				this.logger.error({
					message: `Template '${template}' is not a function. Type: ${typeof this.templateLookup[template]}`,
					service: SERVICE_NAME,
					method: "buildEmail",
					templateValue: this.templateLookup[template],
				});
				throw new Error(`Template '${template}' is not a function`);
			}
			const mjml = this.templateLookup[template](context);

			// Check if MJML is empty (template failed to load)
			if (!mjml || mjml.trim() === "") {
				const msg = `Template '${template}' returned empty MJML content. Template may have failed to load.`;
				this.logger.error({
					message: msg,
					service: SERVICE_NAME,
					method: "buildEmail",
					template: template,
				});
				throw new Error(msg);
			}

			const html = await this.mjml2html(mjml);

			// Check if HTML is empty
			if (!html || !html.html) {
				const msg = `MJML conversion failed for template '${template}'. No HTML output.`;
				this.logger.error({
					message: msg,
					service: SERVICE_NAME,
					method: "buildEmail",
					template: template,
					mjmlLength: mjml.length,
				});
				throw new Error(msg);
			}

			return html.html;
		} catch (error) {
			this.logger.error({
				message: `Failed to build email for template '${template}': ${error.message}`,
				service: SERVICE_NAME,
				method: "buildEmail",
				template: template,
				error: error.message,
				stack: error.stack,
			});
			throw error;
		}
	};

	/**
	 * Validates email parameters.
	 * @param {string} to - The recipient email address.
	 * @param {string} subject - The email subject.
	 * @param {string} html - The email HTML content.
	 * @returns {boolean} True if valid, false otherwise.
	 */
	validateEmailParams(to, subject, html) {
		if (!to || !subject) {
			this.logger.error({
				message: "Invalid email parameters: missing 'to' or 'subject'",
				service: SERVICE_NAME,
				method: "validateEmailParams",
			});
			return false;
		}

		if (!html || html.trim() === "") {
			this.logger.error({
				message: "Cannot send email: HTML content is empty",
				service: SERVICE_NAME,
				method: "validateEmailParams",
			});
			return false;
		}

		return true;
	}

	/**
	 * Validates the from email address.
	 * @param {string} systemEmailAddress - The system email address.
	 * @returns {boolean} True if valid, false otherwise.
	 */
	validateFromAddress(systemEmailAddress) {
		const fromAddress = systemEmailAddress;
		if (!fromAddress || !fromAddress.includes("@")) {
			this.logger.error({
				message: "Missing or invalid systemEmailAddress - a valid email address is required",
				service: SERVICE_NAME,
				method: "validateFromAddress",
			});
			return false;
		}
		return true;
	}

	/**
	 * Builds the TLS configuration for the email transporter.
	 * @param {Object} config - The email configuration object.
	 * @returns {Object} The TLS configuration object.
	 */
	buildTLSConfig(config) {
		const { systemEmailSecure, systemEmailIgnoreTLS, systemEmailRequireTLS, systemEmailRejectUnauthorized, systemEmailTLSServername } = config;

		const tlsConfig = {};

		// Only apply TLS settings if secure is enabled
		if (systemEmailSecure) {
			// Top-level Nodemailer options (control STARTTLS behavior):
			// - ignoreTLS: If true, the connection will not attempt to use STARTTLS
			// - requireTLS: If true, connection will fail if STARTTLS is not available
			if (systemEmailIgnoreTLS !== undefined) {
				tlsConfig.ignoreTLS = systemEmailIgnoreTLS;
			}
			if (systemEmailRequireTLS !== undefined) {
				tlsConfig.requireTLS = systemEmailRequireTLS;
			}

			// Node.js TLS options (go inside the 'tls' object):
			// - rejectUnauthorized: If false, accepts self-signed certificates
			// - servername: Overrides the hostname for SNI (Server Name Indication)
			const tlsSettings = {};

			if (systemEmailRejectUnauthorized !== undefined) {
				tlsSettings.rejectUnauthorized = systemEmailRejectUnauthorized;
			}
			if (systemEmailTLSServername !== undefined && systemEmailTLSServername !== null && systemEmailTLSServername !== "") {
				tlsSettings.servername = systemEmailTLSServername;
			}

			// Only add tls property if we have TLS settings
			if (Object.keys(tlsSettings).length > 0) {
				tlsConfig.tls = tlsSettings;
				this.logger.debug({
					message: `TLS settings applied to email config`,
					service: SERVICE_NAME,
					method: "buildTLSConfig",
					tlsSettings: Object.keys(tlsSettings),
				});
			}
		}

		return tlsConfig;
	}

	sendEmail = async (to, subject, html, transportConfig) => {
		// Validate email parameters
		if (!this.validateEmailParams(to, subject, html)) {
			return false;
		}

		let config;
		if (typeof transportConfig !== "undefined") {
			config = transportConfig;
		} else {
			config = await this.settingsService.getDBSettings();
		}
		const {
			systemEmailHost,
			systemEmailPort,
			systemEmailSecure,
			systemEmailUser,
			systemEmailAddress,
			systemEmailPassword,
			systemEmailConnectionHost,
		} = config;

		// Validate from address
		if (!this.validateFromAddress(systemEmailAddress)) {
			return false;
		}

		// Build base email config
		const emailConfig = {
			host: systemEmailHost,
			port: Number(systemEmailPort),
			secure: systemEmailSecure,
			pool: config.systemEmailPool ?? false,
			auth: {
				user: systemEmailUser || systemEmailAddress,
				pass: systemEmailPassword,
			},
			name: systemEmailConnectionHost || "localhost",
			connectionTimeout: 5000,
		};

		// Apply TLS configuration
		const tlsConfig = this.buildTLSConfig(config);
		Object.assign(emailConfig, tlsConfig);

		this.transporter = this.nodemailer.createTransport(emailConfig);

		try {
			await this.transporter.verify();
		} catch (error) {
			this.logger.warn({
				message: "Email transporter verification failed",
				service: SERVICE_NAME,
				method: "sendEmail",
				error: error.message,
			});
			return false;
		}

		try {
			const info = await this.transporter.sendMail({
				to: to,
				from: systemEmailAddress,
				subject: subject,
				html: html,
			});
			return info?.messageId;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "sendEmail",
				stack: error.stack,
			});
			return false;
		}
	};
}

export default EmailService;
