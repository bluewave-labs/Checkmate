import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import { PasswordEndAdornment } from "@/Components/v1/Inputs/TextInput/Adornments/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";

const SettingsPagespeed = ({
	isAdmin,
	HEADING_SX,
	isApiKeySet,
	apiKeyHasBeenReset,
	setApiKeyHasBeenReset,
	defaults,
	control,
	setValue,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [apiKey, setApiKey] = useState("");

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
					<Controller
						name="pagespeedApiKey"
						control={control}
						defaultValue={defaults.pagespeedApiKey}
						render={({ field, fieldState }) => (
							<TextInput
								{...field}
								label={t("settingsPage.pageSpeedSettings.labelApiKey")}
								type={"password"}
								optionalLabel="(Optional)"
								endAdornment={<PasswordEndAdornment />}
								error={!!fieldState.error}
								helperText={fieldState.error?.message}
							/>
						)}
					/>
				)}

				{isApiKeySet === true && apiKeyHasBeenReset === false && (
					<Box>
						<Typography>{t("settingsPage.pageSpeedSettings.labelApiKeySet")}</Typography>
						<Button
							onClick={() => {
								setValue("pagespeedApiKey", "");
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
	isApiKeySet: PropTypes.bool,
	setIsApiKeySet: PropTypes.func,
	apiKeyHasBeenReset: PropTypes.bool,
	setApiKeyHasBeenReset: PropTypes.func,
};

export default SettingsPagespeed;
