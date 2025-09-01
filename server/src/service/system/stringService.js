const SERVICE_NAME = "StringService";

class StringService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(translationService) {
		if (StringService.instance) {
			return StringService.instance;
		}

		this.translationService = translationService;
		this._language = "en"; // default language
		StringService.instance = this;
	}

	get serviceName() {
		return StringService.SERVICE_NAME;
	}

	setLanguage(language) {
		this._language = language;
	}

	get language() {
		return this._language;
	}

	/**
	 * Get translation by key with optional parameters
	 * @param {string} key - Translation key
	 * @param {Object} params - Optional parameters to replace in the translation
	 * @returns {string} Translated string with replaced parameters
	 */
	get(key, params = {}) {
		let translation = this.translationService.getTranslation(key);
		
		// Replace parameters in the translation
		Object.keys(params).forEach(paramKey => {
			const paramValue = params[paramKey];
			// Support both {param} and ${param} syntax
			translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
			translation = translation.replace(new RegExp(`\\$\\{${paramKey}\\}`, 'g'), paramValue);
		});
		
		return translation;
	}
}

export default StringService;
