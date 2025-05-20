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
import { useSendTestEmail } from "../../Hooks/useSendTestEmail";
import { createToast } from "../../Utils/toastUtils";

const SettingsEmail = ({
	isAdmin,
	HEADER_SX,
	handleChange,
	settingsData,
	setSettingsData,
	isPasswordSet,
}) => {
	// Setup
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [password, setPassword] = useState("");
	const [hasBeenReset, setHasBeenReset] = useState(false);

	// Network
	const [isSending, , sendTestEmail] = useSendTestEmail(); // Using empty placeholder for unused error variable

	// Handlers
	const handlePasswordChange = (e) => {
		setPassword(e.target.value);
		setSettingsData({
			...settingsData,
			settings: { ...settingsData.settings, systemEmailPassword: e.target.value },
		});
	};

	/**
	 * Handle sending test email with current form values
	 */
	const handleSendTestEmail = () => {
		// Collect current form values
		const emailConfig = {
			systemEmailHost: settingsData?.settings?.systemEmailHost,
			systemEmailPort: settingsData?.settings?.systemEmailPort,
			systemEmailUser: settingsData?.settings?.systemEmailUser,
			systemEmailAddress: settingsData?.settings?.systemEmailAddress,
			systemEmailPassword: password || settingsData?.settings?.systemEmailPassword,
			systemEmailConnectionHost: settingsData?.settings?.systemEmailConnectionHost
		};
		
		// Basic validation
		if (!emailConfig.systemEmailHost || !emailConfig.systemEmailPort) {
			createToast({
				body: t("settingsEmailRequiredFields", "Email host and port are required"),
				variant: "error"
			});
			return;
		}
		
		// Send test email with current form values
		sendTestEmail(emailConfig);
	};

	if (!isAdmin) {
		return null;
	}

	return (
		<ConfigBox>
			<Box>
				<Typography component="h1" variant="h2">{t("settingsEmail")}</Typography>
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
					<Box>
						<Typography>{t("settingsEmailConnectionHost")}</Typography>
						<TextInput
							name="systemEmailConnectionHost"
							placeholder="bluewavelabs.ca"
							value={settingsData?.settings?.systemEmailConnectionHost ?? ""}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Button
							variant="contained"
							color="accent"
							loading={isSending}
							onClick={handleSendTestEmail}
						>
							{t("settingsTestEmail", "Send test e-mail")}
						</Button>
					</Box>
				</Stack>
			</Box>
		</ConfigBox>
	);
};

SettingsEmail.propTypes = {
	isAdmin: PropTypes.bool,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
	handleChange: PropTypes.func,
	HEADER_SX: PropTypes.object,
	isPasswordSet: PropTypes.bool,
};

export default SettingsEmail;
