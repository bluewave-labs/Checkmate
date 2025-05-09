import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ConfigBox from "../../Components/ConfigBox";
import TextInput from "../../Components/Inputs/TextInput";
import Dialog from "../../Components/Dialog";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const SettingsStats = ({ HEADING_SX, handleChange, settings, errors }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					sx={HEADING_SX}
				>
					{t("settingsHistoryAndMonitoring")}
				</Typography>
				<Typography sx={{ mt: theme.spacing(2) }}>
					{t("settingsHistoryAndMonitoringDescription")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<TextInput
					name="checkTTL"
					label={t("settingsTTLLabel")}
					optionalLabel={t("settingsTTLOptionalLabel")}
					value={settings?.checkTTL ?? ""}
					onChange={handleChange}
					type="number"
					error={errors.checkTTL ? true : false}
					helperText={errors.checkTTL}
				/>
				<Box>
					<Typography>{t("settingsClearAllStats")}</Typography>
					<Button
						variant="contained"
						color="error"
						onClick={() => setIsOpen(true)}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("settingsClearAllStatsButton")}
					</Button>
				</Box>
			</Stack>
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("settingsClearAllStatsDialogTitle")}
				description={t("settingsClearAllStatsDialogDescription")}
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel={t("settingsClearAllStatsDialogConfirm")}
				onConfirm={() => {
					const syntheticEvent = {
						target: {
							name: "deleteStats",
						},
					};
					handleChange(syntheticEvent);
					setIsOpen(false);
				}}
				isLoading={false}
			/>
		</ConfigBox>
	);
};

SettingsStats.propTypes = {
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	settings: PropTypes.object,
	errors: PropTypes.object,
};

export default SettingsStats;
