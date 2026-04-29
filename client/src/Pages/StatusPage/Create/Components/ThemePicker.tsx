import { useTranslation } from "react-i18next";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import { RadioWithDescription, Select } from "@/Components/inputs";
import {
	STATUS_PAGE_THEMES,
	STATUS_PAGE_THEME_MODES,
	type StatusPageTheme,
	type StatusPageThemeMode,
} from "@/Types/StatusPage";

interface Props {
	theme: StatusPageTheme;
	themeMode: StatusPageThemeMode;
	onThemeChange: (value: StatusPageTheme) => void;
	onThemeModeChange: (value: StatusPageThemeMode) => void;
}

export const ThemePicker = ({
	theme,
	themeMode,
	onThemeChange,
	onThemeModeChange,
}: Props) => {
	const { t } = useTranslation();
	const muiTheme = useTheme();

	return (
		<Stack spacing={muiTheme.spacing(6)}>
			<RadioGroup
				value={theme}
				onChange={(_, value) => onThemeChange(value as StatusPageTheme)}
			>
				<Stack spacing={muiTheme.spacing(4)}>
					{STATUS_PAGE_THEMES.map((option) => (
						<RadioWithDescription
							key={option}
							value={option}
							label={t(`pages.statusPages.form.theme.options.${option}.name`)}
							description={t(
								`pages.statusPages.form.theme.options.${option}.description`
							)}
						/>
					))}
				</Stack>
			</RadioGroup>

			<Select
				fieldLabel={t("pages.statusPages.form.themeMode.label")}
				value={themeMode}
				onChange={(e) => onThemeModeChange(e.target.value as StatusPageThemeMode)}
			>
				{STATUS_PAGE_THEME_MODES.map((mode) => (
					<MenuItem
						key={mode}
						value={mode}
					>
						{t(`pages.statusPages.form.themeMode.${mode}`)}
					</MenuItem>
				))}
			</Select>
		</Stack>
	);
};
