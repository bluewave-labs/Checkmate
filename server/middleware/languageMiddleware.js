import logger from "../utils/logger.js";

const languageMiddleware =
	(stringService, translationService, settingsService) => async (req, res, next) => {
		try {
			const settings = await settingsService.getSettings();

			let language = settings && settings.language ? settings.language : null;

			if (!language) {
				const acceptLanguage = req.headers["accept-language"] || "en";
				language = acceptLanguage.split(",")[0].slice(0, 2).toLowerCase();
			}

			translationService.setLanguage(language);
			stringService.setLanguage(language);

			next();
		} catch (error) {
			logger.error({
				message: error.message,
				service: "languageMiddleware",
			});
			const acceptLanguage = req.headers["accept-language"] || "en";
			const language = acceptLanguage.split(",")[0].slice(0, 2).toLowerCase();

			translationService.setLanguage(language);
			stringService.setLanguage(language);

			next();
		}
	};

export default languageMiddleware;
