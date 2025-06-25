import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import Select from "../../Components/Inputs/Select";
import timezones from "../../Utils/timezones.json";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
const SettingsTimeZone = ({ HEADING_SX, handleChange, timezone }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.timezoneSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					<Typography component="span">
						{t("settingsPage.timezoneSettings.description")}
					</Typography>
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Select
					label={t("settingsPage.timezoneSettings.label")}
					name="timezone"
					value={timezone}
					onChange={handleChange}
					items={timezones}
				/>
			</Stack>
		</ConfigBox>
	);
};

SettingsTimeZone.propTypes = {
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	timezone: PropTypes.string,
};

export default SettingsTimeZone;
