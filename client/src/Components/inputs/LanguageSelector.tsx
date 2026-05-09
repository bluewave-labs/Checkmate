import MenuItem from "@mui/material/MenuItem";
import { Select } from "@/Components/inputs";

import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setLanguage } from "@/Features/UI/uiSlice";
import type { RootState } from "@/Types/state";

export const languageNames: Record<string, string> = {
	en: "English",
	de: "Deutsch",
	ca: "Català",
	es: "Español",
	fr: "Français",
	"pt-BR": "Português (BR)",
	cs: "Čeština",
	fi: "Suomi",
	tr: "Türkçe",
	ru: "Русский",
	uk: "Українська",
	ar: "العربية",
	th: "ไทย",
	vi: "Tiếng Việt",
	ja: "日本語",
	"zh-CN": "简体中文",
	"zh-TW": "繁體中文",
};

export const LanguageSelector = () => {
	const { i18n } = useTranslation();
	const { language = "en" } = useSelector((state: RootState) => state.ui);
	const dispatch = useDispatch();
	const handleChange = (event: any) => {
		const newLang = event.target.value;
		dispatch(setLanguage(newLang));
	};

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<Select
			value={language}
			onChange={handleChange}
			size="small"
		>
			{languages.map((lang) => (
				<MenuItem
					key={lang}
					value={lang}
				>
					{languageNames[lang] ?? lang}
				</MenuItem>
			))}
		</Select>
	);
};

export default LanguageSelector;
