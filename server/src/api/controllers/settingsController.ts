import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { updateAppSettingsBodyValidation } from "@/api/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/api/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { IEmailService } from "@/service/emailService.js";
import { Settings } from "@/domain/app-settings/app-settings.type.js";

const SERVICE_NAME = "SettingsController";

export interface ISettingsController {
	getAppSettings: RequestHandler;
	updateAppSettings: RequestHandler;
	sendTestEmail: RequestHandler;
}

class SettingsController implements ISettingsController {
	static SERVICE_NAME = SERVICE_NAME;
	private settingsService: ISettingsService;
	private emailService: IEmailService;
	constructor(settingsService: ISettingsService, emailService: IEmailService) {
		this.settingsService = settingsService;
		this.emailService = emailService;
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

	getAppSettings = catchAsync(async (req: Request, res: Response) => {
		const dbSettings = await this.settingsService.getDBSettings();

		const returnSettings = this.buildAppSettings(dbSettings);
		return res.status(200).json({
			success: true,
			msg: "App settings fetched successfully",
			data: returnSettings,
		});
	});

	updateAppSettings = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = updateAppSettingsBodyValidation.parse(req.body);

		const updatedSettings = await this.settingsService.updateDbSettings(validatedBody);
		const returnSettings = this.buildAppSettings(updatedSettings);
		return res.status(200).json({
			success: true,
			msg: "App settings updated successfully",
			data: returnSettings,
		});
	});

	sendTestEmail = catchAsync(async (req: Request, res: Response) => {
		sendTestEmailBodyValidation.parse(req.body);

		const {
			to,
			systemEmailHost,
			systemEmailPort,
			systemEmailAddress,
			systemEmailDisplayName,
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

		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		if (!html) {
			throw new AppError({ message: "Failed to build email template.", status: 500 });
		}
		const messageId = await this.emailService.sendEmail(to, subject, html, {
			systemEmailHost,
			systemEmailPort,
			systemEmailUser,
			systemEmailAddress,
			systemEmailDisplayName,
			systemEmailPassword,
			systemEmailConnectionHost,
			systemEmailSecure,
			systemEmailPool,
			systemEmailIgnoreTLS,
			systemEmailRequireTLS,
			systemEmailRejectUnauthorized,
			systemEmailTLSServername,
		});

		if (!messageId) {
			throw new AppError({ message: "Failed to send test email.", status: 500 });
		}

		return res.status(200).json({
			success: true,
			msg: "Test email sent successfully",
			data: { messageId },
		});
	});
}

export default SettingsController;
