import fs from "fs";
import path from "path";

class TranslationService {
	static SERVICE_NAME = "TranslationService";
	constructor(logger) {
		this.logger = logger;
		this.translations = {};
		this._language = "en";
		this.localesDir = path.join(process.cwd(), "locales");
	}

	get serviceName() {
		return TranslationService.SERVICE_NAME;
	}

	setLanguage(language) {
		this._language = language;
	}

	get language() {
		return this._language;
	}

	async initialize() {
		try {
			await this.loadFromFiles();
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: "TranslationService",
				method: "initialize",
				stack: error.stack,
			});
		}
	}

	async loadFromFiles() {
		try {
			if (!fs.existsSync(this.localesDir)) {
				return false;
			}

			const files = fs.readdirSync(this.localesDir).filter((file) => file.endsWith(".json"));

			if (files.length === 0) {
				return false;
			}

			for (const file of files) {
				const language = file.replace(".json", "");
				const filePath = path.join(this.localesDir, file);
				const content = fs.readFileSync(filePath, "utf8");
				this.translations[language] = JSON.parse(content);
			}

			this.logger.info({
				message: "Translations loaded from files successfully",
				service: "TranslationService",
				method: "loadFromFiles",
			});

			return true;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: "TranslationService",
				method: "loadFromFiles",
				stack: error.stack,
			});
			return false;
		}
	}

	getTranslation(key) {
		let language = this._language;

		try {
			return this.translations[language]?.[key] || this.translations["en"]?.[key] || key;
		} catch (error) {
			this.logger.error({
				message: error.message,
				service: "TranslationService",
				method: "getTranslation",
				stack: error.stack,
			});
			return key;
		}
	}
}

export default TranslationService;
