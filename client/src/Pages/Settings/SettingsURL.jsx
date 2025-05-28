import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import Select from "../../Components/Inputs/Select";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";

const SettingsURL = ({ HEADING_SX, handleChange, showURL }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<ConfigBox>
			<Box>
				<Typography component="h1">{t("settingsURLTitle")}</Typography>
				<Typography sx={HEADING_SX}>{t("settingsURLDescription")}</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Select
					name="showURL"
					label={t("settingsURLSelectTitle")}
					value={showURL}
					onChange={handleChange}
					items={[
						{ _id: true, name: t("settingsURLEnabled") },
						{ _id: false, name: t("settingURLDisabled") },
					]}
				></Select>
			</Stack>
		</ConfigBox>
	);
};

SettingsURL.propTypes = {
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	showURL: PropTypes.bool,
};

export default SettingsURL;
