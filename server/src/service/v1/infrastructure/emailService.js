import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
				// Try multiple possible paths for template files
				// to support both development and production environments
				const possiblePaths = [
					// Production/Docker path - templates in dist/templates (from dist/src/service/v1/infrastructure)
					this.path.join(__dirname, `../../../templates/${templateName}.mjml`),
					// Alternative production path - templates in dist/templates (from dist/service/v1/infrastructure)
					this.path.join(__dirname, `../../templates/${templateName}.mjml`),
					// If running from dist, templates might be in parent src directory
					this.path.join(__dirname, `../../../../src/templates/${templateName}.mjml`),
					// Development path - from the project root
					this.path.join(process.cwd(), `templates/${templateName}.mjml`),
					this.path.join(process.cwd(), `src/templates/${templateName}.mjml`),
					this.path.join(process.cwd(), `dist/templates/${templateName}.mjml`),
				];

				let templatePath;
				let templateContent;

				// Try each path until we find one that works
				for (const tryPath of possiblePaths) {
					try {
						if (this.fs.existsSync(tryPath)) {
							templatePath = tryPath;
							templateContent = this.fs.readFileSync(templatePath, "utf8");
							break;
						}
					} catch (e) {
						// Continue to next path
					}
				}

				if (!templateContent) {
					throw new Error(`Template file not found in any of: ${possiblePaths.map((p) => p.replace(__dirname, ".")).join(", ")}`);
				}

				this.logger.debug({
					message: `Loading template: ${templateName}`,
					service: SERVICE_NAME,
					method: "loadTemplate",
					templatePath: templatePath,
				});

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
				// Return a no-op function that returns empty string to prevent runtime errors
				return () => "";
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

	sendEmail = async (to, subject, html, transportConfig) => {
		// Validate required fields
		if (!to || !subject) {
			this.logger.error({
				message: "Invalid email parameters: missing 'to' or 'subject'",
				service: SERVICE_NAME,
				method: "sendEmail",
			});
			return false;
		}

		// Validate HTML content
		if (!html || html.trim() === "") {
			this.logger.warn({
				message: "Email HTML content is empty, using fallback text",
				service: SERVICE_NAME,
				method: "sendEmail",
				to: this.redactEmail(to),
				subject: this.redactSubject(subject),
			});
			html = "<p>Email content unavailable</p>";
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
			systemEmailRejectUnauthorized,
			systemEmailIgnoreTLS,
			systemEmailRequireTLS,
			systemEmailTLSServername,
		} = config;

		// Validate from address
		const fromAddress = systemEmailAddress || systemEmailUser;
		if (!fromAddress || !fromAddress.includes("@")) {
			this.logger.error({
				message: "Invalid from email address",
				service: SERVICE_NAME,
				method: "sendEmail",
			});
			return false;
		}

		// Build base email config
		const emailConfig = {
			host: systemEmailHost,
			port: Number(systemEmailPort),
			secure: systemEmailSecure,
			auth: {
				user: systemEmailUser || systemEmailAddress,
				pass: systemEmailPassword,
			},
			name: systemEmailConnectionHost || "localhost",
			connectionTimeout: 5000,
		};

		// Conditionally add TLS settings only if secure is enabled
		if (systemEmailSecure) {
			// Add top-level TLS options
			if (systemEmailIgnoreTLS !== undefined) {
				emailConfig.ignoreTLS = systemEmailIgnoreTLS;
			}
			if (systemEmailRequireTLS !== undefined) {
				emailConfig.requireTLS = systemEmailRequireTLS;
			}

			const tlsSettings = {};

			// Only add TLS settings that are explicitly configured
			// (rejectUnauthorized and servername go INSIDE the tls object)
			if (systemEmailRejectUnauthorized !== undefined) {
				tlsSettings.rejectUnauthorized = systemEmailRejectUnauthorized;
			}
			if (systemEmailTLSServername !== undefined && systemEmailTLSServername !== null && systemEmailTLSServername !== "") {
				tlsSettings.servername = systemEmailTLSServername;
			}

			// Only add tls property if we have TLS settings
			if (Object.keys(tlsSettings).length > 0) {
				emailConfig.tls = tlsSettings;
				this.logger.debug({
					message: `TLS settings applied to email config`,
					service: SERVICE_NAME,
					method: "sendEmail",
					tlsSettings: Object.keys(tlsSettings),
				});
			}
		}
		this.transporter = this.nodemailer.createTransport(emailConfig);

		try {
			await this.transporter.verify();
		} catch (error) {
			this.logger.warn({
				message: "Email transporter verification failed",
				service: SERVICE_NAME,
				method: "verifyTransporter",
			});
			return false;
		}

		try {
			const info = await this.transporter.sendMail({
				to: to,
				from: fromAddress,
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
