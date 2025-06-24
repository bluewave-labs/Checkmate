import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const primaryLanguage = "en";

// Load all translation files eagerly
const translations = import.meta.glob("../locales/*.json", { eager: true });

const resources = {};
Object.keys(translations).forEach((path) => {
	const langCode = path.match(/\/([^/]+)\.json$/)[1];
	resources[langCode] = {
		translation: translations[path].default || translations[path],
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
