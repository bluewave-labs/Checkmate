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

		const normalizedHost = (systemEmailHost ?? "").trim();
		const normalizedFromAddress = (systemEmailAddress ?? "").trim();
		const normalizedUser = (systemEmailUser || normalizedFromAddress || "").trim();
		let normalizedPassword = systemEmailPassword ?? "";

		// Gmail app passwords are often copied with spaces every 4 characters.
		if (/gmail\.com$|googlemail\.com$/i.test(normalizedHost)) {
			normalizedPassword = normalizedPassword.replace(/\s+/g, "");
		}

		if (!normalizedHost || !systemEmailPort || !normalizedFromAddress || !normalizedUser || !normalizedPassword) {
			this.logger.warn({
				message: "Missing required SMTP settings (host/port/from/user/password)",
				service: SERVICE_NAME,
				method: "sendEmail",
			});
			return false;
		}

		const emailConfig = {
			host: normalizedHost,
			port: Number(systemEmailPort),
			secure: systemEmailSecure,
			auth: {
				user: normalizedUser,
				pass: normalizedPassword,
			},
			name: systemEmailConnectionHost || "localhost",
			connectionTimeout: 15000,
			pool: systemEmailPool,
			tls: {
				rejectUnauthorized: systemEmailRejectUnauthorized,
				ignoreTLS: systemEmailIgnoreTLS,
				requireTLS: systemEmailRequireTLS,
				servername: systemEmailTLSServername,
			},
		};

		const attemptSend = async (configToUse: typeof emailConfig): Promise<string | undefined> => {
			this.transporter = this.nodemailer.createTransport(configToUse);

			try {
				await this.transporter.verify();
			} catch (error: unknown) {
				this.logger.warn({
					message: `Email transporter verification failed, attempting send anyway: ${error instanceof Error ? error.message : "Unknown error"}`,
					service: SERVICE_NAME,
					method: "verifyTransporter",
					stack: error instanceof Error ? error.stack : undefined,
				});
			}

			const info = await this.transporter.sendMail({
				to: to,
				from: normalizedFromAddress,
				subject: subject,
				html: html,
			});

			return info?.messageId;
		};

		try {
			return await attemptSend(emailConfig);
		} catch (error: unknown) {
			const isGmail = /gmail\.com$|googlemail\.com$/i.test(normalizedHost);
			if (!isGmail) {
				this.logger.error({
					message: error instanceof Error ? error.message : "Unknown error",
					service: SERVICE_NAME,
					method: "sendEmail",
					stack: error instanceof Error ? error.stack : undefined,
				});
				return;
			}

			const fallbackConfigs = [
				{ ...emailConfig, port: 465, secure: true },
				{ ...emailConfig, port: 587, secure: false, tls: { ...emailConfig.tls, requireTLS: true } },
			];

			for (const fallbackConfig of fallbackConfigs) {
				if (fallbackConfig.port === emailConfig.port && fallbackConfig.secure === emailConfig.secure) {
					continue;
				}
				try {
					this.logger.warn({
						message: `Retrying Gmail SMTP with fallback transport port=${fallbackConfig.port} secure=${fallbackConfig.secure}`,
						service: SERVICE_NAME,
						method: "sendEmail",
					});
					return await attemptSend(fallbackConfig);
				} catch (fallbackError: unknown) {
					this.logger.warn({
						message: `Fallback Gmail SMTP attempt failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
						service: SERVICE_NAME,
						method: "sendEmail",
						stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
					});
				}
			}

			this.logger.error({
				message: error instanceof Error ? error.message : "Unknown error",
				service: SERVICE_NAME,
				method: "sendEmail",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}
