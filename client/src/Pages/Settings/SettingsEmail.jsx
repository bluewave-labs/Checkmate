import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordEndAdornment } from "../../Components/Inputs/TextInput/Adornments";
const SettingsEmail = ({
	HEADER_SX,
	handleChange,
	settingsData,
	setSettingsData,
	isPasswordSet,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const [password, setPassword] = useState("");
	const [hasBeenReset, setHasBeenReset] = useState(false);

	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
		setSettingsData({
			...settingsData,
			settings: { ...settingsData.settings, systemEmailPassword: e.target.value },
		});
	};

	return (
		<ConfigBox>
			<Box>
				<Typography component="h1">{t("settingsEmail")}</Typography>
				<Typography sx={HEADER_SX}>{t("settingsEmailDescription")}</Typography>
			</Box>
			<Box>
				<Stack gap={theme.spacing(10)}>
					<Box>
						<Typography>{t("settingsEmailHost")}</Typography>
						<TextInput
							name="systemEmailHost"
							placeholder="smtp.gmail.com"
							value={settingsData?.settings?.systemEmailHost ?? ""}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsEmailPort")}</Typography>
						<TextInput
							name="systemEmailPort"
							placeholder="425"
							type="number"
							value={settingsData?.settings?.systemEmailPort ?? ""}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsEmailUser")}</Typography>
						<TextInput
							name="systemEmailUser"
							placeholder="Leave empty if not required"
							value={settingsData?.settings?.systemEmailUser ?? ""}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsEmailAddress")}</Typography>
						<TextInput
							name="systemEmailAddress"
							placeholder="uptime@bluewavelabs.ca"
							value={settingsData?.settings?.systemEmailAddress ?? ""}
							onChange={handleChange}
						/>
					</Box>
					{(isPasswordSet === false || hasBeenReset === true) && (
						<Box>
							<Typography>{t("settingsEmailPassword")}</Typography>
							<TextInput
								name="systemEmailPassword"
								type="password"
								placeholder="123 456 789 101112"
								value={password}
								onChange={handlePasswordChange}
								endAdornment={<PasswordEndAdornment />}
							/>
						</Box>
					)}
					{isPasswordSet === true && hasBeenReset === false && (
						<Box>
							<Typography>{t("settingsEmailFieldResetLabel")}</Typography>
							<Button
								onClick={() => {
									setPassword("");
									setSettingsData({
										...settingsData,
										settings: { ...settingsData.settings, systemEmailPassword: "" },
									});
									setHasBeenReset(true);
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
			</Box>
		</ConfigBox>
	);
};

SettingsEmail.propTypes = {
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
	handleChange: PropTypes.func,
	HEADER_SX: PropTypes.object,
	isPasswordSet: PropTypes.bool,
};

export default SettingsEmail;
