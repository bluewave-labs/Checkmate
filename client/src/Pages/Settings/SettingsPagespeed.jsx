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

const SettingsPagespeed = ({
	isAdmin,
	HEADING_SX,
	settingsData,
	setSettingsData,
	isApiKeySet,
	lastSavedSettings,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	// Local state
	const [apiKey, setApiKey] = useState("");
	const [hasBeenReset, setHasBeenReset] = useState(false);

	// Initialize API key from settings data when component mounts or settingsData changes
	useEffect(() => {
		const savedKey = settingsData?.settings?.pagespeedApiKey || "";
		if (savedKey) {
			setApiKey(savedKey);
			setHasBeenReset(false);
		}
	}, [settingsData]);

	// Handler
	const handleChange = (e) => {
		const newValue = e.target.value;
		setApiKey(newValue);
		setSettingsData({
			...settingsData,
			settings: {
				...settingsData.settings,
				pagespeedApiKey: newValue,
			},
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
					{t("pageSpeedApiKeyFieldTitle")}
				</Typography>
				<Typography sx={HEADING_SX}>{t("pageSpeedApiKeyFieldDescription")}</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				{/* Always show the textbox */}
				<TextInput
					name="pagespeedApiKey"
					label={t("pageSpeedApiKeyFieldLabel")}
					value={apiKey}
					type={"password"}
					onChange={handleChange}
					optionalLabel="(Optional)"
					endAdornment={<PasswordEndAdornment />}
				/>

				{/* Only show reset button if there's an API key */}
				{apiKey && (
					<Box>
						<Typography>{t("pageSpeedApiKeyFieldResetLabel")}</Typography>
						<Button
							onClick={() => {
								setApiKey("");
								setSettingsData({
									...settingsData,
									settings: {
										...settingsData.settings,
										pagespeedApiKey: "",
									},
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
		</ConfigBox>
	);
};

SettingsPagespeed.propTypes = {
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	settingsData: PropTypes.object,
	setSettingsData: PropTypes.func,
	isApiKeySet: PropTypes.bool,
};

export default SettingsPagespeed;
