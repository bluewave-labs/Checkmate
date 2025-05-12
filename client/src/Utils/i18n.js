import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { setLanguage } from "../Features/UI/uiSlice";
import store from "../store";

const primaryLanguage = "en";

const translations = import.meta.glob("../locales/*.json", { eager: true });

const resources = {};
Object.keys(translations).forEach((path) => {
	const langCode = path.match(/\/([^/]+)\.json$/)[1];
	resources[langCode] = {
		translation: translations[path].default || translations[path],
	};
});

const savedLanguage = store.getState()?.ui?.language;
const initialLanguage = savedLanguage;

i18n.use(initReactI18next).init({
	resources,
	lng: initialLanguage,
	fallbackLng: primaryLanguage,
	debug: import.meta.env.MODE === "development",
	ns: ["translation"],
	defaultNS: "translation",
	interpolation: {
		escapeValue: false,
	},
});

i18n.on("languageChanged", (lng) => {
	store.dispatch(setLanguage(lng));
});

export default i18n;
