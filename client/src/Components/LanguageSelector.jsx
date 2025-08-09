import { useTranslation } from "react-i18next";
import { Box, MenuItem, Select, Stack } from "@mui/material";
import { useTheme } from "@emotion/react";
import "flag-icons/css/flag-icons.min.css";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setLanguage } from "../Features/UI/uiSlice";

const langMap = {
	cs: "cz",
	ja: "jp",
	uk: "ua",
	vi: "vn",
};

const LanguageSelector = () => {
	const { i18n } = useTranslation();
	const theme = useTheme();
	const { language } = useSelector((state) => state.ui);
	const dispatch = useDispatch();
	const handleChange = (event) => {
		const newLang = event.target.value;
		dispatch(setLanguage(newLang));
	};

	const languages = Object.keys(i18n.options.resources || {});

	return (
		<Select
			value={language}
			onChange={handleChange}
			size="small"
			sx={{
				minWidth: 80,
				"& .MuiSelect-select": {
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				},
				"& .MuiSelect-icon": {
					alignSelf: "center",
				},
			}}
		>
			{languages.map((lang) => {
				let parsedLang = lang === "en" ? "gb" : lang;

				if (parsedLang.includes("-")) {
					parsedLang = parsedLang.split("-")[1].toLowerCase();
				}

				parsedLang = langMap[parsedLang] || parsedLang;

				const flag = parsedLang ? `fi fi-${parsedLang}` : null;

				return (
					<MenuItem
						key={lang}
						value={lang}
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<Stack
							direction="row"
							spacing={theme.spacing(2)}
							alignItems="center"
							justifyContent="center"
						>
							<Box
								component="span"
								sx={{
									display: "flex",
									alignItems: "center",
								}}
							>
								{flag && <span className={flag} />}
							</Box>
							<Box
								component="span"
								sx={{ textTransform: "uppercase" }}
							>
								{lang}
							</Box>
						</Stack>
					</MenuItem>
				);
			})}
		</Select>
	);
};

export default LanguageSelector;
