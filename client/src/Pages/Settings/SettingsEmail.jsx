import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { Switch } from "@mui/material";
import TextLink from "../../Components/TextLink";
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
	isEmailPasswordSet,
	emailPasswordHasBeenReset,
	setEmailPasswordHasBeenReset,
}) => {
	// Setup
	const { t } = useTranslation();
	const theme = useTheme();

	// Destructure settings with default values
	const {
		systemEmailHost = "",
		systemEmailPort = "",
		systemEmailSecure = false,
		systemEmailPool = false,
		systemEmailUser = "",
		systemEmailAddress = "",
		systemEmailPassword = "",
		systemEmailTLSServername = "",
		systemEmailConnectionHost = "localhost",
		systemEmailIgnoreTLS = false,
		systemEmailRequireTLS = false,
		systemEmailRejectUnauthorized = true,
	} = settingsData?.settings || {};
	// Local state
	const [password, setPassword] = useState("");

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
			systemEmailHost,
			systemEmailPort,
			systemEmailSecure,
			systemEmailPool,
			systemEmailUser,
			systemEmailAddress,
			systemEmailPassword: password || systemEmailPassword,
			systemEmailTLSServername,
			systemEmailConnectionHost,
			systemEmailIgnoreTLS,
			systemEmailRequireTLS,
			systemEmailRejectUnauthorized,
		};

		// Basic validation
		if (
			!emailConfig.systemEmailHost ||
			!emailConfig.systemEmailPort ||
			!emailConfig.systemEmailAddress ||
			!emailConfig.systemEmailPassword
		) {
			createToast({
				body: t("settingsPage.emailSettings.toastEmailRequiredFieldsError"),
				variant: "error",
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
				<Typography
					component="h1"
					variant="h2"
				>
					{t("settingsPage.emailSettings.title")}
				</Typography>
				<Typography sx={HEADER_SX}>
					{t("settingsPage.emailSettings.description")}
				</Typography>
			</Box>
			<Box>
				<Stack gap={theme.spacing(10)}>
					<Box>
						<Typography>{t("settingsPage.emailSettings.labelHost")}</Typography>
						<TextInput
							name="systemEmailHost"
							placeholder="smtp.gmail.com"
							value={systemEmailHost}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsPage.emailSettings.labelPort")}</Typography>
						<TextInput
							name="systemEmailPort"
							placeholder="425"
							type="number"
							value={systemEmailPort}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsPage.emailSettings.labelUser")}</Typography>
						<TextInput
							name="systemEmailUser"
							placeholder={t("settingsPage.emailSettings.placeholderUser")}
							value={systemEmailUser}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsPage.emailSettings.labelAddress")}</Typography>
						<TextInput
							name="systemEmailAddress"
							placeholder="uptime@bluewavelabs.ca"
							value={systemEmailAddress}
							onChange={handleChange}
						/>
					</Box>
					{(isEmailPasswordSet === false || emailPasswordHasBeenReset === true) && (
						<Box>
							<Typography>{t("settingsPage.emailSettings.labelPassword")}</Typography>
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

					{isEmailPasswordSet === true && emailPasswordHasBeenReset === false && (
						<Box>
							<Typography>{t("settingsPage.emailSettings.labelPasswordSet")}</Typography>
							<Button
								onClick={() => {
									setPassword("");
									setSettingsData({
										...settingsData,
										settings: { ...settingsData.settings, systemEmailPassword: "" },
									});
									setEmailPasswordHasBeenReset(true);
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
						<Typography>{t("settingsPage.emailSettings.labelTLSServername")}</Typography>
						<TextInput
							name="systemEmailTLSServername"
							placeholder="bluewavelabs.ca"
							value={systemEmailTLSServername}
							onChange={handleChange}
						/>
					</Box>
					<Box>
						<Typography>{t("settingsPage.emailSettings.labelConnectionHost")}</Typography>
						<TextInput
							name="systemEmailConnectionHost"
							placeholder="bluewavelabs.ca"
							value={systemEmailConnectionHost}
							onChange={handleChange}
						/>
					</Box>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: theme.spacing(4),
						}}
					>
						{[
							[
								"settingsPage.emailSettings.labelSecure",
								"systemEmailSecure",
								systemEmailSecure,
							],
							[
								"settingsPage.emailSettings.labelPool",
								"systemEmailPool",
								systemEmailPool,
							],
							[
								"settingsPage.emailSettings.labelIgnoreTLS",
								"systemEmailIgnoreTLS",
								systemEmailIgnoreTLS,
							],
							[
								"settingsPage.emailSettings.labelRequireTLS",
								"systemEmailRequireTLS",
								systemEmailRequireTLS,
							],
							[
								"settingsPage.emailSettings.labelRejectUnauthorized",
								"systemEmailRejectUnauthorized",
								systemEmailRejectUnauthorized,
							],
						].map(([labelKey, name, value]) => (
							<Box
								key={name}
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Typography>{t(labelKey)}</Typography>
								<Switch
									name={name}
									checked={value}
									onChange={handleChange}
								/>
							</Box>
						))}

						<TextLink
							text={t("settingsPage.emailSettings.descriptionTransport")}
							linkText={t("settingsPage.emailSettings.linkTransport")}
							href="https://nodemailer.com/smtp"
							target="_blank"
						/>
						<Box
							component={"pre"}
							sx={{
								fontFamily: "monospace",
								p: 2,
								borderRadius: 1,
								overflow: "auto",
							}}
						>
							<code>
								{JSON.stringify(
									{
										host: systemEmailHost,
										port: systemEmailPort,
										secure: systemEmailSecure,
										auth: {
											user: systemEmailUser || systemEmailAddress,
											pass: "<your_password>",
										},
										name: systemEmailConnectionHost || "localhost",
										pool: systemEmailPool,
										tls: {
											rejectUnauthorized: systemEmailRejectUnauthorized,
											ignoreTLS: systemEmailIgnoreTLS,
											requireTLS: systemEmailRequireTLS,
											servername: systemEmailTLSServername,
										},
									},
									null,
									2
								)}
							</code>
						</Box>
					</Box>

					<Box>
						{systemEmailHost &&
							systemEmailPort &&
							systemEmailAddress &&
							systemEmailPassword && (
								<Button
									variant="contained"
									color="accent"
									loading={isSending}
									onClick={handleSendTestEmail}
								>
									{t("settingsPage.emailSettings.buttonSendTestEmail")}
								</Button>
							)}
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
