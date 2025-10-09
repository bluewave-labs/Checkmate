import "flag-icons/css/flag-icons.min.css";
import { Select } from "@/Components/v2/Inputs";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { setLanguage } from "@/Features/UI/uiSlice";
import type { SelectChangeEvent } from "@mui/material/Select";

export const LanguageSelector = () => {
	const { i18n } = useTranslation();
	const theme = useTheme();
	const dispatch = useDispatch();
	const language = useSelector((state: any) => state.ui.language);
	const languages = Object.keys(i18n.options.resources || {});
	const languageMap: Record<string, string> = {
		cs: "cz",
		ja: "jp",
		uk: "ua",
		vi: "vn",
	};

	const handleChange = (event: SelectChangeEvent<unknown>) => {
		const newLang = event.target.value;
		dispatch(setLanguage(newLang));
	};

	const languagesForDisplay = languages.map((l) => {
		let formattedLanguage = l === "en" ? "gb" : l;
		formattedLanguage = formattedLanguage.includes("-")
			? formattedLanguage.split("-")[1].toLowerCase()
			: formattedLanguage;
		formattedLanguage = languageMap[formattedLanguage] || formattedLanguage;
		const flag = formattedLanguage ? `fi fi-${formattedLanguage}` : null;

		return (
			<MenuItem
				key={l}
				value={l}
			>
				<Stack
					direction="row"
					gap={theme.spacing(4)}
				>
					{flag && <span className={flag} />}
					<Typography textTransform={"uppercase"}>{l}</Typography>
				</Stack>
			</MenuItem>
		);
	});

	return (
		<Select
			value={language}
			onChange={handleChange}
		>
			{languagesForDisplay}
		</Select>
	);
};
