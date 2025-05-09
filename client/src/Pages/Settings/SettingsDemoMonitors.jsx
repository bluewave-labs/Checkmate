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
const SettingsDemoMonitors = ({
	isLoading,
	authIsLoading,
	checksIsLoading,
	handleChange,
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Local state
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<ConfigBox>
				<Box>
					<Typography component="h1">{t("settingsDemoMonitors")}</Typography>
					<Typography sx={{ mt: theme.spacing(2) }}>
						{t("settingsDemoMonitorsDescription")}
					</Typography>
				</Box>
				<Box>
					<Typography>{t("settingsAddDemoMonitors")}</Typography>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading || authIsLoading || checksIsLoading}
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
						{t("settingsAddDemoMonitorsButton")}
					</Button>
				</Box>
			</ConfigBox>
			<ConfigBox>
				<Box>
					<Typography component="h1">{t("settingsSystemReset")}</Typography>
					<Typography sx={{ mt: theme.spacing(2) }}>
						{t("settingsSystemResetDescription")}
					</Typography>
				</Box>
				<Box>
					<Typography>{t("settingsRemoveAllMonitors")}</Typography>
					<Button
						variant="contained"
						color="error"
						loading={isLoading || authIsLoading || checksIsLoading}
						onClick={() => setIsOpen(true)}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("settingsRemoveAllMonitorsButton")}
					</Button>
				</Box>
				<Dialog
					open={isOpen}
					theme={theme}
					title={t("settingsRemoveAllMonitorsDialogTitle")}
					onCancel={() => setIsOpen(false)}
					confirmationButtonLabel={t("settingsRemoveAllMonitorsDialogConfirm")}
					onConfirm={() => {
						const syntheticEvent = {
							target: {
								name: "deleteMonitors",
							},
						};
						handleChange(syntheticEvent);
						setIsOpen(false);
					}}
					isLoading={isLoading || authIsLoading || checksIsLoading}
				/>
			</ConfigBox>
		</>
	);
};

SettingsDemoMonitors.propTypes = {
	isLoading: PropTypes.bool,
	authIsLoading: PropTypes.bool,
	checksIsLoading: PropTypes.bool,
	handleChange: PropTypes.func,
};

export default SettingsDemoMonitors;
