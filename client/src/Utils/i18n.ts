import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Resource } from "i18next";

const primaryLanguage = "en";

interface TranslationModule {
	default?: Record<string, unknown>;
	[key: string]: unknown;
}

// Load all translation files eagerly
const translations = import.meta.glob<TranslationModule>("../locales/*.json", {
	eager: true,
});

const resources: Resource = {};
Object.keys(translations).forEach((path) => {
	const match = path.match(/\/([^/]+)\.json$/);
	if (!match) return;
	const langCode = match[1];
	resources[langCode] = {
		translation: translations[path].default ?? translations[path],
	};
});

i18n.use(initReactI18next).init({
	resources,
	lng: primaryLanguage,
	fallbackLng: primaryLanguage,
	debug: import.meta.env.MODE === "development",
	ns: ["translation"],
	defaultNS: "translation",
	interpolation: {
		escapeValue: false,
	},
	returnEmptyString: false,
});

export default i18n;
