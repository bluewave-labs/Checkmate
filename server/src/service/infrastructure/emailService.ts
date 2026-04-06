import { fileURLToPath } from "url";
import { EmailTransportConfig } from "@/types/index.js";
import { ISettingsService } from "@/service/system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import mjml2html from "mjml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = "EmailService";
type MjmlFn = typeof mjml2html;
type FileSystem = typeof fs;
type PathModule = typeof path;
type Mailer = typeof nodemailer;
type TemplateCompiler = (template: string) => (context: Record<string, unknown>) => string;

export interface IEmailService {
	init(): void;
	buildEmail(template: string, context: Record<string, unknown>): Promise<string | undefined>;
	sendEmail(to: string, subject: string, html: string, transportConfig?: EmailTransportConfig): Promise<string | false | undefined>;
}

export class EmailService implements IEmailService {
	static SERVICE_NAME = SERVICE_NAME;

	private settingsService: ISettingsService;
	private fs: FileSystem;
	private path: PathModule;
	private compile: TemplateCompiler;
	private mjml2html: MjmlFn;
	private nodemailer: Mailer;
	private logger: ILogger;
	private transporter: ReturnType<typeof import("nodemailer").createTransport> | null = null;
	private currentConfig: EmailTransportConfig | null = null;
	private templateLookup: Record<string, ((context: Record<string, unknown>) => string) | undefined>;
	private loadTemplate: (templateName: string) => ((context: Record<string, unknown>) => string) | undefined;

	constructor(
		settingsService: ISettingsService,
		fs: FileSystem,
		path: PathModule,
		compile: TemplateCompiler,
		mjml2html: MjmlFn,
		nodemailer: Mailer,
		logger: ILogger
	) {
		this.settingsService = settingsService;
		this.fs = fs;
		this.path = path;
		this.compile = compile;
		this.mjml2html = mjml2html;
		this.nodemailer = nodemailer;
		this.logger = logger;
		this.templateLookup = {};
		this.loadTemplate = () => undefined;
		this.init();
	}

	get serviceName() {
		return EmailService.SERVICE_NAME;
	}

	private getTransporter = async (config: EmailTransportConfig) => {
		// Check if we need to recreate the transporter (config changed)
		const configChanged = !this.currentConfig || JSON.stringify(this.currentConfig) !== JSON.stringify(config);

		if (!this.transporter || configChanged) {
			// Close existing transporter if it exists
			if (this.transporter) {
				try {
					this.transporter.close();
				} catch {
					this.logger.warn({
						message: "Error closing existing transporter",
						service: SERVICE_NAME,
						method: "getTransporter",
					});
				}
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
				connectionTimeout: 10000, // Increased from 5000ms
				pool: systemEmailPool !== false, // Enable pooling by default
				tls: {
					rejectUnauthorized: systemEmailRejectUnauthorized,
					ignoreTLS: systemEmailIgnoreTLS,
					requireTLS: systemEmailRequireTLS,
					servername: systemEmailTLSServername,
				},
			};

			this.transporter = this.nodemailer.createTransport(emailConfig);
			this.currentConfig = config;

			this.logger.info({
				message: "Created new email transporter",
				service: SERVICE_NAME,
				method: "getTransporter",
			});
		}

		return this.transporter;
	};

	init = () => {
		this.loadTemplate = (templateName) => {
			try {
				const templatePath = this.path.join(__dirname, `../../templates/${templateName}.mjml`);
				const templateContent = this.fs.readFileSync(templatePath, "utf8");
				return this.compile(templateContent);
			} catch (error: unknown) {
				this.logger.error({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "loadTemplate",
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
		};

		this.templateLookup = {
			welcomeEmailTemplate: this.loadTemplate("welcomeEmail"),
			employeeActivationTemplate: this.loadTemplate("employeeActivation"),
			noIncidentsThisWeekTemplate: this.loadTemplate("noIncidentsThisWeek"),
			passwordResetTemplate: this.loadTemplate("passwordReset"),
			testEmailTemplate: this.loadTemplate("testEmailTemplate"),
			unifiedNotificationTemplate: this.loadTemplate("unifiedNotification"),
		};
	};

	buildEmail = async (template: string, context: Record<string, unknown>) => {
		try {
			const mjml = this.templateLookup[template]?.(context);
			if (!mjml) {
				throw new Error(`Template ${template} not found`);
			}
			const html = await this.mjml2html(mjml);
			return html.html;
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "buildEmail",
				stack: error instanceof Error ? error.stack : undefined,
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

		try {
			const transporter = await this.getTransporter(config);

			// Verify transporter connection (only log warnings, don't fail)
			try {
				await transporter.verify();
			} catch (error: unknown) {
				this.logger.warn({
					message: "Email transporter verification failed",
					service: SERVICE_NAME,
					method: "sendEmail",
					stack: error instanceof Error ? error.stack : undefined,
				});
				// Continue anyway - some SMTP servers don't support verification
			}

			const info = await transporter.sendMail({
				to: to,
				from: config.systemEmailAddress,
				subject: subject,
				html: html,
			});
			return info?.messageId;
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "sendEmail",
				stack: error instanceof Error ? error.stack : undefined,
			});
			return false;
		}
	};
}
