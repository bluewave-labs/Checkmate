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

const SettingsStats = ({ isAdmin, HEADING_SX, handleChange, settingsData, errors }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
					sx={HEADING_SX}
				>
					{t("settingsPage.statsSettings.title")}
				</Typography>
				<Typography sx={{ mt: theme.spacing(2) }}>
					{t("settingsPage.statsSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<TextInput
					name="checkTTL"
					label={t("settingsPage.statsSettings.labelTTL")}
					optionalLabel={t("settingsPage.statsSettings.labelTTLOptional")}
					value={settingsData?.settings?.checkTTL ?? ""}
					onChange={handleChange}
					type="number"
					error={errors.checkTTL ? true : false}
					helperText={errors.checkTTL}
				/>
				<Box>
					<Typography>
						{t("settingsPage.statsSettings.clearAllStatsDescription")}
					</Typography>
					<Button
						variant="contained"
						color="error"
						onClick={() => setIsOpen(true)}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("settingsPage.statsSettings.clearAllStatsButton")}
					</Button>
				</Box>
			</Stack>
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("settingsPage.statsSettings.clearAllStatsDialogTitle")}
				description={t("settingsPage.statsSettings.clearAllStatsDialogDescription")}
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel={t(
					"settingsPage.statsSettings.clearAllStatsDialogConfirm"
				)}
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
	isAdmin: PropTypes.bool,
	HEADING_SX: PropTypes.object,
	handleChange: PropTypes.func,
	settingsData: PropTypes.object,
	errors: PropTypes.object,
};

export default SettingsStats;
