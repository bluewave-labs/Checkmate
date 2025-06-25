import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";
import { PasswordEndAdornment } from "../../Components/Inputs/TextInput/Adornments";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SettingsPagespeed = ({
	isAdmin,
	HEADING_SX,
	settingsData,
	setSettingsData,
	isApiKeySet,
	apiKeyHasBeenReset,
	setApiKeyHasBeenReset,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [apiKey, setApiKey] = useState("");

	// Handler
	const handleChange = (e) => {
		setApiKey(e.target.value);
		setSettingsData({
			...settingsData,
			settings: { ...settingsData.settings, pagespeedApiKey: e.target.value },
		});
	};

	if (!isAdmin) {
		return null;
	}

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.pageSpeedSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t("settingsPage.pageSpeedSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				{(isApiKeySet === false || apiKeyHasBeenReset === true) && (
					<TextInput
						name="pagespeedApiKey"
						label={t("settingsPage.pageSpeedSettings.labelApiKey")}
						value={apiKey}
						type={"password"}
						onChange={handleChange}
						optionalLabel="(Optional)"
						endAdornment={<PasswordEndAdornment />}
					/>
				)}

				{isApiKeySet === true && apiKeyHasBeenReset === false && (
					<Box>
						<Typography>{t("settingsPage.pageSpeedSettings.labelApiKeySet")}</Typography>
						<Button
							onClick={() => {
								setApiKey("");
								setSettingsData({
									...settingsData,
									settings: { ...settingsData.settings, pagespeedApiKey: "" },
								});
								setApiKeyHasBeenReset(true);
							}}
							variant="contained"
							color="error"
							sx={{ mt: theme.spacing(4) }}
						>
							{t("reset")}
						</Button>
					</Box>
				)}
			</Stack>
		</ConfigBox>
	);
};

SettingsPagespeed.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
	isApiKeySet: PropTypes.bool,
	setIsApiKeySet: PropTypes.func,
	apiKeyHasBeenReset: PropTypes.bool,
	setApiKeyHasBeenReset: PropTypes.func,
};

export default SettingsPagespeed;
