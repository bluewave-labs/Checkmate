import i18n from "../../Utils/i18n";
import { useSelector } from "react-redux";
import { useEffect } from "react";
const I18nLoader = () => {
	const language = useSelector((state) => state.ui.language);

	useEffect(() => {
		if (language && i18n.language !== language) {
			i18n.changeLanguage(language);
		}
	}, [language]);

	return null;
};

export default I18nLoader;
