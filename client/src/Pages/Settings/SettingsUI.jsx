import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import Select from "@/Components/v1/Inputs/Select/index.jsx";
import DummyChart from "./DummyChart";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2Theme";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { setMode, setLanguage, setChartType } from "@/Features/UI/uiSlice.js";

const SettingsUI = ({ HEADING_SX }) => {
	const {
		mode,
		language = "en",
		chartType = "histogram",
	} = useSelector((state) => state.ui);
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const languages = Object.keys(i18n.options.resources || {});
	const dispatch = useDispatch();
	const v2Theme = mode === "dark" ? darkTheme : lightTheme;
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.uiSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t("settingsPage.uiSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Select
					name="mode"
					label={t("settingsPage.uiSettings.labelTheme")}
					value={mode}
					onChange={(e) => dispatch(setMode(e.target.value))}
					items={[
						{ _id: "light", name: "Light" },
						{ _id: "dark", name: "Dark" },
					]}
				></Select>
				<Select
					name="language"
					label={t("settingsPage.uiSettings.labelLanguage")}
					value={language}
					onChange={(e) => dispatch(setLanguage(e.target.value))}
					items={languages.map((lang) => ({ _id: lang, name: lang.toUpperCase() }))}
				></Select>
				<Select
					name="chartType"
					label={t("settingsPage.uiSettings.labelChartType")}
					value={chartType}
					onChange={(e) => dispatch(setChartType(e.target.value))}
					items={[
						{ _id: "histogram", name: t("settingsPage.uiSettings.chartTypeHistogram") },
						{ _id: "heatmap", name: t("settingsPage.uiSettings.chartTypeHeatmap") },
					]}
				></Select>
				<ThemeProvider theme={v2Theme}>
					<DummyChart chartType={chartType} />
				</ThemeProvider>
			</Stack>
		</ConfigBox>
	);
};

SettingsUI.propTypes = {
	HEADING_SX: PropTypes.object,
};

export default SettingsUI;
