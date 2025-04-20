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
		try {
			const settings = { ...(await this.settingsService.getSettings()) };
			delete settings.jwtSecret;
			return res.success({
				msg: this.stringService.getAppSettings,
				data: settings,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getAppSettings"));
		}
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
