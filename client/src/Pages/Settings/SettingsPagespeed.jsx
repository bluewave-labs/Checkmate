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
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const SettingsPagespeed = ({ HEADING_SX, settings, setSettings }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [apiKey, setApiKey] = useState("");
	const [isApiKeySet, setIsApiKeySet] = useState(false);
	const [hasBeenReset, setHasBeenReset] = useState(false);

	// Handler
	const handleChange = (e) => {
		setApiKey(e.target.value);
		setSettings({ ...settings, pagespeedApiKey: e.target.value });
	};

	useEffect(() => {
		console.log(settings);
		setIsApiKeySet(Boolean(settings.pagespeedApiKey) && apiKey === "");
	}, [settings, apiKey]);

	return (
		<ConfigBox>
			<Box>
				<Typography component="h1">{t("pageSpeedApiKeyFieldTitle")}</Typography>
				<Typography sx={HEADING_SX}>{t("pageSpeedApiKeyFieldDescription")}</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				{(isApiKeySet === false || hasBeenReset === true) && (
					<TextInput
						name="pagespeedApiKey"
						label={t("pageSpeedApiKeyFieldLabel")}
						value={apiKey}
						type={"password"}
						onChange={handleChange}
						optionalLabel="(Optional)"
						endAdornment={<PasswordEndAdornment />}
					/>
				)}

				{isApiKeySet === true && hasBeenReset === false && (
					<Box>
						<Typography>{t("pageSpeedApiKeyFieldResetLabel")}</Typography>
						<Button
							onClick={() => {
								setApiKey("");
								setSettings({ ...settings, pagespeedApiKey: "" });
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
		</ConfigBox>
	);
};

SettingsPagespeed.propTypes = {
	HEADING_SX: PropTypes.object,
	settings: PropTypes.object,
	setSettings: PropTypes.func,
};

export default SettingsPagespeed;
