import { updateAppSettingsBodyValidation } from "../validation/joi.js";
import { sendTestEmailBodyValidation } from "../validation/joi.js";
import { asyncHandler, createServerError } from "../utils/errorUtils.js";

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

	getAppSettings = asyncHandler(
		async (req, res, next) => {
			const dbSettings = await this.settingsService.getDBSettings();

			const returnSettings = this.buildAppSettings(dbSettings);
			return res.success({
				msg: this.stringService.getAppSettings,
				data: returnSettings,
			});
		},
		SERVICE_NAME,
		"getAppSettings"
	);

	updateAppSettings = asyncHandler(
		async (req, res, next) => {
			await updateAppSettingsBodyValidation.validateAsync(req.body);

			const updatedSettings = await this.db.updateAppSettings(req.body);
			const returnSettings = this.buildAppSettings(updatedSettings);
			return res.success({
				msg: this.stringService.updateAppSettings,
				data: returnSettings,
			});
		},
		SERVICE_NAME,
		"updateAppSettings"
	);

	sendTestEmail = asyncHandler(
		async (req, res, next) => {
			try {
				await sendTestEmailBodyValidation.validateAsync(req.body);
			} catch (error) {
				next(handleValidationError(error, SERVICE_NAME));
				return;
			}

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

			const html = await this.emailService.buildEmail("testEmailTemplate", context);
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
				throw createServerError("Failed to send test email.");
			}

			return res.success({
				msg: this.stringService.sendTestEmail,
				data: { messageId },
			});
		},
		SERVICE_NAME,
		"sendTestEmail"
	);
}

export default SettingsController;
