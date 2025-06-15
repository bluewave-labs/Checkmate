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

	init = async () => {
		/**
		 * Loads an email template from the filesystem.
		 *
		 * @param {string} templateName - The name of the template to load.
		 * @returns {Function} A compiled template function that can be used to generate HTML email content.
		 */
		this.loadTemplate = (templateName) => {
			try {
				const templatePath = this.path.join(
					__dirname,
					`../templates/${templateName}.mjml`
				);
				const templateContent = this.fs.readFileSync(templatePath, "utf8");
				return this.compile(templateContent);
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "loadTemplate",
					stack: error.stack,
				});
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

	/**
	 * Asynchronously builds and sends an email using a specified template and context.
	 *
	 * @param {string} template - The name of the template to use for the email body.
	 * @param {Object} context - The data context to render the template with.
	 * @param {string} to - The recipient's email address.
	 * @param {string} subject - The subject of the email.
	 * @returns {Promise<string>} A promise that resolves to the messageId of the sent email.
	 */
	buildAndSendEmail = async (template, context, to, subject, transportConfig) => {
		// TODO - Consider an update transporter method so this only needs to be recreated when smtp settings change
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

		const buildHtml = async (template, context) => {
			try {
				const mjml = this.templateLookup[template](context);
				const html = await this.mjml2html(mjml);
				return html.html;
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "buildAndSendEmail",
					stack: error.stack,
				});
			}
		};

		const sendEmail = async (to, subject, html) => {
			try {
				const info = await this.transporter.sendMail({
					to: to,
					from: systemEmailAddress,
					subject: subject,
					html: html,
				});
				return info;
			} catch (error) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "sendEmail",
					stack: error.stack,
				});
			}
		};
		const html = await buildHtml(template, context);
		const info = await sendEmail(to, subject, html);
		return info?.messageId;
	};
}

export default EmailService;
