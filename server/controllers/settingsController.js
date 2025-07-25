import { updateAppSettingsBodyValidation } from "../validation/joi.js";
import { sendTestEmailBodyValidation } from "../validation/joi.js";
import BaseController from "./baseController.js";

const SERVICE_NAME = "SettingsController";

class SettingsController extends BaseController {
	constructor(commonDependencies, { settingsService, emailService }) {
		super(commonDependencies);
		this.settingsService = settingsService;
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

	getAppSettings = this.asyncHandler(
		async (req, res) => {
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

	updateAppSettings = this.asyncHandler(
		async (req, res) => {
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

	sendTestEmail = this.asyncHandler(
		async (req, res) => {
			await sendTestEmailBodyValidation.validateAsync(req.body);

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
				throw this.errorService.createServerError("Failed to send test email.");
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
