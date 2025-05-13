import { updateAppSettingsBodyValidation } from "../validation/joi.js";
import { handleValidationError, handleError } from "./controllerUtils.js";

const SERVICE_NAME = "SettingsController";

class SettingsController {
	constructor(db, settingsService, stringService) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	getAppSettings = async (req, res, next) => {
		const dbSettings = await this.settingsService.getDBSettings();
		const sanitizedSettings = { ...dbSettings };

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
}

export default SettingsController;
