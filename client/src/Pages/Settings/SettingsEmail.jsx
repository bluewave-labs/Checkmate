import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { Switch } from "@mui/material";
import TextLink from "@/Components/v1/TextLink/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";
import { usePost } from "@/Hooks/UseApi";
import { useSelector } from "react-redux";
import { createToast } from "@/Utils/toastUtils.jsx";
import { Controller } from "react-hook-form";

const SettingsEmail = ({
	isAdmin,
	HEADER_SX,
	isEmailPasswordSet,
	emailPasswordHasBeenReset,
	setEmailPasswordHasBeenReset,
	control,
	defaults,
	formValues,
	setValue,
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
	} = formValues || {};

	// Network
	const { post: sendTestEmailFn, loading: isSending } = usePost();
	const user = useSelector((state) => state.auth.user);

	// Handlers

	/**
	 * Handle sending test email with current form values
	 */
	const handleSendTestEmail = () => {
		// Basic validation
		if (
			!systemEmailHost ||
			!systemEmailPort ||
			!systemEmailAddress ||
			!systemEmailPassword
		) {
			createToast({
				body: t("pages.settings.emailSettings.toastEmailRequiredFieldsError"),
				variant: "error",
			});
			return;
		}

		// Send test email - only include optional fields if they have values
		sendTestEmailFn("/settings/test-email", {
			to: user.email,
			systemEmailHost,
			systemEmailPort,
			systemEmailAddress,
			systemEmailPassword: password || systemEmailPassword,
			systemEmailSecure,
			systemEmailPool,
			systemEmailIgnoreTLS,
			systemEmailRequireTLS,
			systemEmailRejectUnauthorized,
			...(systemEmailUser && { systemEmailUser }),
			...(systemEmailTLSServername && { systemEmailTLSServername }),
			...(systemEmailConnectionHost && { systemEmailConnectionHost }),
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
					{t("pages.settings.emailSettings.title")}
				</Typography>
				<Typography sx={HEADER_SX}>
					{t("pages.settings.emailSettings.description")}
				</Typography>
			</Box>

			<Stack gap={theme.spacing(10)}>
				<Box>
					<Controller
						name="systemEmailHost"
						control={control}
						defaultValue={defaults.systemEmailHost}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelHost")}
								placeholder="smtp.gmail.com"
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				</Box>
				<Box>
					<Controller
						name="systemEmailPort"
						control={control}
						defaultValue={defaults.systemEmailPort}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelPort")}
								placeholder="425"
								type="number"
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				</Box>
				<Box>
					<Controller
						name="systemEmailUser"
						control={control}
						defaultValue={defaults.systemEmailUser}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelUser")}
								placeholder={t("pages.settings.emailSettings.placeholderUser")}
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				</Box>
				<Box>
					<Controller
						name="systemEmailAddress"
						control={control}
						defaultValue={defaults.systemEmailAddress}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelAddress")}
								placeholder="uptime@bluewavelabs.ca"
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				</Box>
				{(isEmailPasswordSet === false || emailPasswordHasBeenReset === true) && (
					<Box>
						<Controller
							name="systemEmailPassword"
							control={control}
							defaultValue={defaults.systemEmailPassword}
							render={({ field, fieldState }) => (
								<TextInput
									{...field}
									label={t("pages.settings.emailSettings.labelPassword")}
									type="password"
									placeholder="123 456 789 101112"
									endAdornment={<PasswordEndAdornment />}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
								/>
							)}
						/>
					</Box>
				)}

				{isEmailPasswordSet === true && emailPasswordHasBeenReset === false && (
					<Box>
						<Typography>{t("pages.settings.emailSettings.labelPasswordSet")}</Typography>
						<Button
							onClick={() => {
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
					<Controller
						name="systemEmailTLSServername"
						control={control}
						defaultValue={defaults.systemEmailTLSServername}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelTLSServername")}
								placeholder="bluewavelabs.ca"
							/>
						)}
					/>
				</Box>
				<Box>
					<Controller
						name="systemEmailConnectionHost"
						control={control}
						defaultValue={defaults.systemEmailConnectionHost}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.emailSettings.labelConnectionHost")}
								placeholder="bluewavelabs.ca"
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
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
							"pages.settings.emailSettings.labelSecure",
							"systemEmailSecure",
							systemEmailSecure,
						],
						[
							"pages.settings.emailSettings.labelPool",
							"systemEmailPool",
							systemEmailPool,
						],
						[
							"pages.settings.emailSettings.labelIgnoreTLS",
							"systemEmailIgnoreTLS",
							systemEmailIgnoreTLS,
						],
						[
							"pages.settings.emailSettings.labelRequireTLS",
							"systemEmailRequireTLS",
							systemEmailRequireTLS,
						],
						[
							"pages.settings.emailSettings.labelRejectUnauthorized",
							"systemEmailRejectUnauthorized",
							systemEmailRejectUnauthorized,
						],
					].map(([labelKey, name, value]) => (
						<Controller
							key={name}
							name={name}
							control={control}
							defaultValue={defaults[name]}
							render={({ field }) => (
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
										{...field}
										checked={field.value}
									/>
								</Box>
							)}
						/>
					))}

					<TextLink
						text={t("pages.settings.emailSettings.descriptionTransport")}
						linkText={t("pages.settings.emailSettings.linkTransport")}
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

				<pre>
					{JSON.stringify({
						systemEmailHost: systemEmailHost,
						systemEmailAddress: systemEmailAddress,
						systemEmailPassword: systemEmailPassword,
					})}
				</pre>

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
								{t("pages.settings.emailSettings.buttonSendTestEmail")}
							</Button>
						)}
				</Box>
			</Stack>
		</ConfigBox>
	);
};

SettingsEmail.propTypes = {
	isAdmin: PropTypes.bool,
	HEADER_SX: PropTypes.object,
	isPasswordSet: PropTypes.bool,
};

export default SettingsEmail;
