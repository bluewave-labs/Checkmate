import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "../../Components/ConfigBox";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "../../Components/Dialog";
import { useState } from "react";

const SettingsDemoMonitors = ({ isAdmin, HEADER_SX, handleChange, isLoading }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Local state
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}

	return (
		<>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						{t("settingsPage.demoMonitorsSettings.title")}
					</Typography>
					<Typography sx={HEADER_SX}>
						{t("settingsPage.demoMonitorsSettings.description")}
					</Typography>
				</Box>
				<Box>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading}
						onClick={() => {
							const syntheticEvent = {
								target: {
									name: "demo",
								},
							};
							handleChange(syntheticEvent);
						}}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("settingsPage.demoMonitorsSettings.buttonAddMonitors")}
					</Button>
				</Box>
			</ConfigBox>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						{t("settingsPage.systemResetSettings.title")}
					</Typography>
					<Typography sx={{ mt: theme.spacing(2) }}>
						{t("settingsPage.systemResetSettings.description")}
					</Typography>
				</Box>
				<Box>
					<Button
						variant="contained"
						color="error"
						loading={isLoading}
						onClick={() => setIsOpen(true)}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("settingsPage.systemResetSettings.buttonRemoveAllMonitors")}
					</Button>
				</Box>
				<Dialog
					open={isOpen}
					theme={theme}
					title={t("settingsPage.systemResetSettings.dialogTitle")}
					onCancel={() => setIsOpen(false)}
					confirmationButtonLabel={t("settingsPage.systemResetSettings.dialogConfirm")}
					onConfirm={() => {
						const syntheticEvent = {
							target: {
								name: "deleteMonitors",
							},
						};
						handleChange(syntheticEvent);
						setIsOpen(false);
					}}
					isLoading={isLoading}
				/>
			</ConfigBox>
		</>
	);
};

SettingsDemoMonitors.propTypes = {
	isAdmin: PropTypes.bool,
	handleChange: PropTypes.func,
	HEADER_SX: PropTypes.object,
};

export default SettingsDemoMonitors;
