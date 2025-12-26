import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";

const SettingsTwilio = ({
	isAdmin,
	HEADER_SX,
	handleChange,
	settingsData,
	setSettingsData,
}) => {
	// Setup
	const { t } = useTranslation();
	const theme = useTheme();

	// Destructure settings with default values
	const {
		twilioAccountSid = "",
		twilioAuthToken = "",
		twilioPhoneNumber = "",
	} = settingsData?.settings || {};
	
	// Local state

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
					{t("settingsPage.twilioSettings.title")}
				</Typography>
				<Typography sx={HEADER_SX}>
					{t("settingsPage.twilioSettings.description")}
				</Typography>
			</Box>
			<Box>
				<Stack gap={theme.spacing(10)}>
					<Box>
						<TextInput
							label={t("settingsPage.twilioSettings.labelAccountSid")}
							name="twilioAccountSid"
							placeholder={t("settingsPage.twilioSettings.placeholderAccountSid")}
							value={twilioAccountSid}
							onChange={handleChange}
						/>
					</Box>
						<Box>
							<TextInput
								label={t("settingsPage.twilioSettings.labelAuthToken")}
								name="twilioAuthToken"
								type="password"
								placeholder={t("settingsPage.twilioSettings.placeholderAuthToken")}
								value={twilioAuthToken}
								onChange={handleChange}
								endAdornment={<PasswordEndAdornment />}
							/>
						</Box>

					<Box>
						<TextInput
							label={t("settingsPage.twilioSettings.labelPhoneNumber")}
							name="twilioPhoneNumber"
							placeholder={t("settingsPage.twilioSettings.placeholderPhoneNumber")}
							value={twilioPhoneNumber}
							onChange={handleChange}
						/>
					</Box>
				</Stack>
			</Box>
		</ConfigBox>
	);
};

SettingsTwilio.propTypes = {
	isAdmin: PropTypes.bool,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
	handleChange: PropTypes.func,
	HEADER_SX: PropTypes.object,
};

export default SettingsTwilio;
