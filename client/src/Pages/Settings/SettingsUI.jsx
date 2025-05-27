import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import Select from "../../Components/Inputs/Select";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";

const SettingsUI = ({ HEADING_SX, handleChange, mode, language }) => {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const languages = Object.keys(i18n.options.resources || {});
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsAppearance")}
				</Typography>
				<Typography sx={HEADING_SX}>{t("settingsAppearanceDescription")}</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Select
					name="mode"
					label={t("settingsThemeMode")}
					value={mode}
					onChange={handleChange}
					items={[
						{ _id: "light", name: "Light" },
						{ _id: "dark", name: "Dark" },
					]}
				></Select>
				<Select
					name="language"
					label={t("settingsLanguage")}
					value={language}
					onChange={handleChange}
					items={languages.map((lang) => ({ _id: lang, name: lang.toUpperCase() }))}
				></Select>
			</Stack>
		</ConfigBox>
	);
};

SettingsUI.propTypes = {
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	mode: PropTypes.string,
	language: PropTypes.string,
};

export default SettingsUI;
