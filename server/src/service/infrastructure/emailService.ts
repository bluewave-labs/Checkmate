import { fileURLToPath } from "url";
import path from "path";
import { EmailTransportConfig } from "@/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = "EmailService";

class EmailService {
	static SERVICE_NAME = SERVICE_NAME;

	private settingsService: any;
	private fs: any;
	private path: any;
	private compile: any;
	private mjml2html: any;
	private nodemailer: any;
	private logger: any;
	private transporter: any;
	private templateLookup: Record<string, Function>;
	private loadTemplate: (templateName: string) => Function;

	constructor(settingsService: any, fs: any, path: any, compile: any, mjml2html: any, nodemailer: any, logger: any) {
		this.settingsService = settingsService;
		this.fs = fs;
		this.path = path;
		this.compile = compile;
		this.mjml2html = mjml2html;
		this.nodemailer = nodemailer;
		this.logger = logger;
		this.templateLookup = {};
		this.loadTemplate = () => {
			return () => {};
		};
		this.init();
	}

	get serviceName() {
		return EmailService.SERVICE_NAME;
	}

	init = () => {
		this.loadTemplate = (templateName) => {
			try {
				const templatePath = this.path.join(__dirname, `../../templates/${templateName}.mjml`);
				const templateContent = this.fs.readFileSync(templatePath, "utf8");
				return this.compile(templateContent);
			} catch (error: any) {
				this.logger.error({
					message: error.message,
					service: SERVICE_NAME,
					method: "loadTemplate",
					stack: error.stack,
				});
			}
		};

		this.templateLookup = {
			welcomeEmailTemplate: this.loadTemplate("welcomeEmail"),
			employeeActivationTemplate: this.loadTemplate("employeeActivation"),
			noIncidentsThisWeekTemplate: this.loadTemplate("noIncidentsThisWeek"),
			serverIsDownTemplate: this.loadTemplate("serverIsDown"),
			serverIsUpTemplate: this.loadTemplate("serverIsUp"),
			passwordResetTemplate: this.loadTemplate("passwordReset"),
			hardwareIncidentTemplate: this.loadTemplate("hardwareIncident"),
			testEmailTemplate: this.loadTemplate("testEmailTemplate"),
			unifiedNotificationTemplate: this.loadTemplate("unifiedNotification"),
		};
	};

	buildEmail = async (template: string, context: Record<string, any>) => {
		try {
			const mjml = this.templateLookup[template]?.(context);
			const html = await this.mjml2html(mjml);
			return html.html;
		} catch (error: any) {
			this.logger.error({
				message: error.message,
				service: SERVICE_NAME,
				method: "buildEmail",
				stack: error.stack,
			});
		}
	};

	sendEmail = async (to: string, subject: string, html: string, transportConfig?: EmailTransportConfig) => {
		let config: EmailTransportConfig;
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
		} catch (error: any) {
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
