import i18n from "@/utils/i18n.js";
import { useAppSelector } from "@/hooks/AppHooks";
import { useEffect } from "react";
export const I18nLoader = () => {
  const language = useAppSelector((state) => state.ui.language);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
};
