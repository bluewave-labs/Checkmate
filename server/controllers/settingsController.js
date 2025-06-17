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

	buildAppSettings = (dbSettings) => {
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
		return returnSettings;
	};

	getAppSettings = async (req, res, next) => {
		const dbSettings = await this.settingsService.getDBSettings();

		const returnSettings = this.buildAppSettings(dbSettings);
		console.log(returnSettings);
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
			const updatedSettings = await this.db.updateAppSettings(req.body);
			const returnSettings = this.buildAppSettings(updatedSettings);
			return res.success({
				msg: this.stringService.updateAppSettings,
				data: returnSettings,
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
				systemEmailSecure,
				systemEmailPool,
				systemEmailIgnoreTLS,
				systemEmailRequireTLS,
				systemEmailRejectUnauthorized,
				systemEmailTLSServername,
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
					systemEmailSecure,
					systemEmailPool,
					systemEmailIgnoreTLS,
					systemEmailRequireTLS,
					systemEmailRejectUnauthorized,
					systemEmailTLSServername,
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
