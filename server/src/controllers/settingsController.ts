import { Request, Response, NextFunction } from "express";
import { updateAppSettingsBodyValidation } from "@/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { IEmailService, ISettingsService } from "@/service/index.js";
import { Settings } from "@/types/settings.js";

const SERVICE_NAME = "SettingsController";

export interface ISettingsController {
	serviceName: string;
	getAppSettings(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	updateAppSettings(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
	sendTestEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
}

class SettingsController implements ISettingsController {
	static SERVICE_NAME = SERVICE_NAME;
	private settingsService: ISettingsService;
	private emailService: IEmailService;
	constructor(settingsService: ISettingsService, emailService: IEmailService) {
		this.settingsService = settingsService;
		this.emailService = emailService;
	}

	get serviceName() {
		return SettingsController.SERVICE_NAME;
	}

	buildAppSettings = (dbSettings: Settings) => {
		const sanitizedSettings: Record<string, unknown> = { ...dbSettings };
		delete sanitizedSettings.version;
		delete sanitizedSettings.jwtSecret;
		const returnSettings: Record<string, unknown | null> = {
			pagespeedKeySet: false,
			emailPasswordSet: false,
			settings: null,
		};

		if (typeof sanitizedSettings.pagespeedApiKey !== "undefined") {
			returnSettings.pagespeedKeySet = true;
			delete sanitizedSettings.pagespeedApiKey;
		}
		if (typeof sanitizedSettings.systemEmailPassword !== "undefined") {
			returnSettings.emailPasswordSet = true;
			delete sanitizedSettings.systemEmailPassword;
		}
		returnSettings.settings = sanitizedSettings;
		return returnSettings;
	};

	getAppSettings = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const dbSettings = await this.settingsService.getDBSettings();

			const returnSettings = this.buildAppSettings(dbSettings);
			return res.status(200).json({
				success: true,
				msg: "App settings fetched successfully",
				data: returnSettings,
			});
		} catch (error) {
			next(error);
		}
	};

	updateAppSettings = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedBody = updateAppSettingsBodyValidation.parse(req.body);

			const updatedSettings = await this.settingsService.updateDbSettings(validatedBody);
			const returnSettings = this.buildAppSettings(updatedSettings);
			return res.status(200).json({
				success: true,
				msg: "App settings updated successfully",
				data: returnSettings,
			});
		} catch (error) {
			next(error);
		}
	};

	sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			sendTestEmailBodyValidation.parse(req.body);
			const dbSettings = await this.settingsService.getDBSettings();

			const {
				to,
				systemEmailHost,
				systemEmailPort,
				systemEmailAddress,
				systemEmailPassword,
				systemEmailUser,
				systemEmailConnectionHost,
				systemEmailSecure,
				systemEmailPool,
				systemEmailIgnoreTLS,
				systemEmailRequireTLS,
				systemEmailRejectUnauthorized,
				systemEmailTLSServername,
			} = req.body;

			const subject = "This is a test email from Checkmate";
			const context = { testName: "Monitoring System" };

			const resolvedHost = systemEmailHost ?? dbSettings.systemEmailHost;
			const resolvedPort = systemEmailPort ?? dbSettings.systemEmailPort;
			const resolvedAddress = systemEmailAddress ?? dbSettings.systemEmailAddress;
			const resolvedPassword = systemEmailPassword ?? dbSettings.systemEmailPassword;
			const resolvedUser = systemEmailUser ?? dbSettings.systemEmailUser;
			const resolvedConnectionHost = systemEmailConnectionHost ?? dbSettings.systemEmailConnectionHost;
			const resolvedSecure = systemEmailSecure ?? dbSettings.systemEmailSecure;
			const resolvedPool = systemEmailPool ?? dbSettings.systemEmailPool;
			const resolvedIgnoreTLS = systemEmailIgnoreTLS ?? dbSettings.systemEmailIgnoreTLS;
			const resolvedRequireTLS = systemEmailRequireTLS ?? dbSettings.systemEmailRequireTLS;
			const resolvedRejectUnauthorized = systemEmailRejectUnauthorized ?? dbSettings.systemEmailRejectUnauthorized;
			const resolvedTLSServername = systemEmailTLSServername ?? dbSettings.systemEmailTLSServername;

			const html = await this.emailService.buildEmail("testEmailTemplate", context);
			if (!html) {
				throw new AppError({ message: "Failed to build email template.", status: 500 });
			}
			const messageId = await this.emailService.sendEmail(to, subject, html, {
				systemEmailHost: resolvedHost,
				systemEmailPort: resolvedPort,
				systemEmailUser: resolvedUser,
				systemEmailAddress: resolvedAddress,
				systemEmailPassword: resolvedPassword,
				systemEmailConnectionHost: resolvedConnectionHost,
				systemEmailSecure: resolvedSecure,
				systemEmailPool: resolvedPool,
				systemEmailIgnoreTLS: resolvedIgnoreTLS,
				systemEmailRequireTLS: resolvedRequireTLS,
				systemEmailRejectUnauthorized: resolvedRejectUnauthorized,
				systemEmailTLSServername: resolvedTLSServername,
			});

			if (!messageId) {
				const isGmail = typeof resolvedHost === "string" && /gmail\.com$|googlemail\.com$/i.test(resolvedHost);
				throw new AppError({
					message: isGmail
						? "Failed to send test email. For Gmail, enable 2-Step Verification and use a 16-character App Password."
						: "Failed to send test email. Please verify SMTP host, port, username, password, and TLS settings.",
					status: 500,
				});
			}

			return res.status(200).json({
				success: true,
				msg: "Test email sent successfully",
				data: { messageId },
			});
		} catch (error) {
			next(error);
		}
	};
}

export default SettingsController;
