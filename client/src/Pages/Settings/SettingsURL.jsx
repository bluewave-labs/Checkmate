import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import Select from "@/Components/v1/Inputs/Select/index.jsx";
import { Controller } from "react-hook-form";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";

const SettingsURL = ({ HEADING_SX, control, defaults }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("pages.settings.urlSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t("pages.settings.urlSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Controller
					name="showURL"
					control={control}
					defaultValue={defaults.showURL}
					render={({ field, fieldState }) => (
						<Select
							{...field}
							error={!!fieldState.error}
							helperText={fieldState.error?.message}
							label={t("pages.settings.urlSettings.label")}
							items={[
								{ _id: true, name: t("pages.settings.urlSettings.selectEnabled") },
								{ _id: false, name: t("pages.settings.urlSettings.selectDisabled") },
							]}
						/>
					)}
				/>
			</Stack>
		</ConfigBox>
	);
};

SettingsURL.propTypes = {
	HEADING_SX: PropTypes.object,
};

export default SettingsURL;
