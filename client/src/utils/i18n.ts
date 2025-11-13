import i18n from "i18next";
import { initReactI18next } from "react-i18next";

type TranslationModule = {
  default?: Record<string, any>;
  [key: string]: any;
};

const primaryLanguage = "en";

// Load all translation files eagerly
const translations = import.meta.glob<TranslationModule>("../locales/*.json", {
  eager: true,
});

const resources: Record<string, any> = {};
Object.keys(translations).forEach((path) => {
  const match = path.match(/\/([^/]+)\.json$/);
  if (!match) {
    console.warn(`Skipping invalid translation file path: ${path}`);
    return;
  }
  const langCode = match[1];
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
