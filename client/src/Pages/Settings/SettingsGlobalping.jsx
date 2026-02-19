import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";

const SettingsGlobalping = ({
	isAdmin,
	HEADING_SX,
	isGlobalpingKeySet,
	globalpingKeyHasBeenReset,
	setGlobalpingKeyHasBeenReset,
	defaults,
	control,
	setValue,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

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
					{t("pages.settings.globalpingSettings.title")}
				</Typography>
				<Typography sx={HEADING_SX}>
					{t("pages.settings.globalpingSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				{(isGlobalpingKeySet === false || globalpingKeyHasBeenReset === true) && (
					<Controller
						name="globalpingApiKey"
						control={control}
						defaultValue={defaults.globalpingApiKey}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("pages.settings.globalpingSettings.labelApiKey")}
								type={"password"}
								optionalLabel="(Optional)"
								endAdornment={<PasswordEndAdornment />}
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				)}

				{isGlobalpingKeySet === true && globalpingKeyHasBeenReset === false && (
					<Box>
						<Typography>
							{t("pages.settings.globalpingSettings.labelApiKeySet")}
						</Typography>
						<Button
							onClick={() => {
								setValue("globalpingApiKey", "");
								setGlobalpingKeyHasBeenReset(true);
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

SettingsGlobalping.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	isGlobalpingKeySet: PropTypes.bool,
	globalpingKeyHasBeenReset: PropTypes.bool,
	setGlobalpingKeyHasBeenReset: PropTypes.func,
	defaults: PropTypes.object,
	control: PropTypes.object,
	setValue: PropTypes.func,
};

export default SettingsGlobalping;
