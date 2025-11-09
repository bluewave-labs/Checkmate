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

	// Initialize template loader and pre-compile frequently used templates.
	// NOTE: This is intentionally synchronous so that templates are available
	// immediately after the constructor returns (prevents race conditions
	// where callers invoke buildEmail before templateLookup is populated).
	init = () => {
		/**
		 * Loads an email template from the filesystem.
		 *
		 * @param {string} templateName - The name of the template to load.
		 * @returns {Function} A compiled template function that can be used to generate HTML email content.
		 */
		this.loadTemplate = (templateName) => {
			try {
				const templatePath = this.path.join(__dirname, `../../../templates/${templateName}.mjml`);
				const templateContent = this.fs.readFileSync(templatePath, "utf8");
				// compile returns a function that accepts a context and returns the rendered mjml string
				return this.compile(templateContent);
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "loadTemplate",
					stack: error.stack,
				});
				// Return null when template can't be loaded so callers can handle it explicitly
				return null;
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
			// Ensure the template exists and is a function. Templates are stored in the lookup
			// with keys like "hardwareIncidentTemplate" mapping to compiled functions.
			let tplFn = this.templateLookup[template];
			if (typeof tplFn !== "function") {
				// Attempt to lazy-load the template. Templates are named by dropping a trailing
				// "Template" suffix (eg. hardwareIncidentTemplate -> hardwareIncident.mjml).
				const baseName = String(template).replace(/Template$/i, "");
				tplFn = this.loadTemplate(baseName);
				if (typeof tplFn === "function") {
					// cache the compiled template for future calls
					this.templateLookup[template] = tplFn;
				} else {
					this.logger.error({
						message: `Template not found or failed to compile: ${template}`,
						service: SERVICE_NAME,
						method: "buildEmail",
					});
					throw new Error(`Template not found or failed to compile: ${template}`);
				}
			}

			const mjml = tplFn(context);
			const result = this.mjml2html(mjml);
			return (result && result.html) || "";
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "buildEmail",
				stack: error.stack,
			});
			// Re-throw to allow callers to detect templating failures instead of silently
			// sending empty emails. Callers can catch and handle/log as needed.
			throw error;
		}
	};

	sendEmail = async (to, subject, html, transportConfig) => {
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
			systemEmailPool,
			systemEmailUser,
			systemEmailAddress,
			systemEmailPassword,
			systemEmailConnectionHost,
			systemEmailTLSServername,
			systemEmailIgnoreTLS,
			systemEmailRequireTLS,
			systemEmailRejectUnauthorized,
		} = config;

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
			pool: systemEmailPool,
			tls: {
				rejectUnauthorized: systemEmailRejectUnauthorized,
				ignoreTLS: systemEmailIgnoreTLS,
				requireTLS: systemEmailRequireTLS,
				servername: systemEmailTLSServername,
			},
		};
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
		}
	};
}

export default EmailService;
