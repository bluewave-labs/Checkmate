import { updateAppSettingsBodyValidation } from "../validation/joi.js";
import { handleValidationError, handleError } from "./controllerUtils.js";
import { sendTestEmailBodyValidation } from "../validation/joi.js";
const SERVICE_NAME = "SettingsController";

class SettingsController {
	constructor({ db, settingsService, stringService, emailService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
		this.emailService = emailService;
	}

	getAppSettings = async (req, res, next) => {
		const dbSettings = await this.settingsService.getDBSettings();
		const sanitizedSettings = { ...dbSettings };
		delete sanitizedSettings.version;

		const returnSettings = {
			pagespeedKeySet: false,
			emailPasswordSet: false,
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
		return res.success({
			msg: this.stringService.getAppSettings,
			data: returnSettings,
		});
	};

	updateAppSettings = async (req, res, next) => {
		try {
			await updateAppSettingsBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			await this.db.updateAppSettings(req.body);
			const updatedSettings = { ...(await this.settingsService.reloadSettings()) };
			delete updatedSettings.jwtSecret;
			return res.success({
				msg: this.stringService.updateAppSettings,
				data: updatedSettings,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "updateAppSettings"));
		}
	};

	sendTestEmail = async (req, res, next) => {
		try {
			await sendTestEmailBodyValidation.validateAsync(req.body);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const {
				to,
				systemEmailHost,
				systemEmailPort,
				systemEmailAddress,
				systemEmailPassword,
				systemEmailUser,
				systemEmailConnectionHost,
			} = req.body;

			const subject = this.stringService.testEmailSubject;
			const context = { testName: "Monitoring System" };

			const messageId = await this.emailService.buildAndSendEmail(
				"testEmailTemplate",
				context,
				to,
				subject,
				{
					systemEmailHost,
					systemEmailPort,
					systemEmailUser,
					systemEmailAddress,
					systemEmailPassword,
					systemEmailConnectionHost,
				}
			);

			if (!messageId) {
				return res.error({
					msg: "Failed to send test email.",
				});
			}

			return res.success({
				msg: this.stringService.sendTestEmail,
				data: { messageId },
			});
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}
	};
}

export default SettingsController;
