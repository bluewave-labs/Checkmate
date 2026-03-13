import { Request, Response, NextFunction } from "express";
import { updateAppSettingsBodyValidation } from "@/validation/settingsValidation.js";
import { sendTestEmailBodyValidation } from "@/validation/notificationValidation.js";
import { AppError } from "@/utils/AppError.js";
import { IEmailService, ISettingsService, IGlobalPingService } from "@/service/index.js";

const SERVICE_NAME = "SettingsController";

class SettingsController {
	static SERVICE_NAME = SERVICE_NAME;
	private settingsService: ISettingsService;
	private emailService: IEmailService;
	private globalPingService: IGlobalPingService;
	constructor(settingsService: ISettingsService, emailService: IEmailService, globalPingService: IGlobalPingService) {
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.globalPingService = globalPingService;
	}

	get serviceName() {
		return SettingsController.SERVICE_NAME;
	}

	buildAppSettings = (dbSettings: any) => {
		const sanitizedSettings = { ...dbSettings };
		delete sanitizedSettings.version;
		delete sanitizedSettings.jwtSecret;
		const returnSettings = {
			pagespeedKeySet: false,
			globalpingKeySet: false,
			emailPasswordSet: false,
			settings: null,
		};

		if (typeof sanitizedSettings.pagespeedApiKey !== "undefined") {
			returnSettings.pagespeedKeySet = true;
			delete sanitizedSettings.pagespeedApiKey;
		}
		if (typeof sanitizedSettings.globalpingApiKey !== "undefined") {
			returnSettings.globalpingKeySet = true;
			delete sanitizedSettings.globalpingApiKey;
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

	getGlobalpingStatus = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const status = await this.globalPingService.getUsageStatus();
			return res.status(200).json({
				success: true,
				msg: "Globalping status fetched successfully",
				data: status,
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

			const html = await this.emailService.buildEmail("testEmailTemplate", context);
			if (!html) {
				throw new AppError({ message: "Failed to build email template.", status: 500 });
			}
			const messageId = await this.emailService.sendEmail(to, subject, html, {
				systemEmailHost,
				systemEmailPort,
				systemEmailUser,
				systemEmailAddress,
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
		} catch (error) {
			next(error);
		}
	};
}

export default SettingsController;
