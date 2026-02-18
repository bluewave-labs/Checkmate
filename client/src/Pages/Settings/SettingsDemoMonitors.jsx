import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import Dialog from "@/Components/v1/Dialog/index.jsx";
import { useState } from "react";
import { useDelete, usePost } from "@/Hooks/UseApi";

const SettingsDemoMonitors = ({ isAdmin, HEADER_SX, isLoading }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	// Local state
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}
	const { post: postDemoMonitors } = usePost();
	const { deleteFn: deleteAllMonitorsFn } = useDelete();
	return (
		<>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						{t("pages.settings.demoMonitorsSettings.title")}
					</Typography>
					<Typography sx={HEADER_SX}>
						{t("pages.settings.demoMonitorsSettings.description")}
					</Typography>
				</Box>
				<Box>
					<Button
						variant="contained"
						color="accent"
						loading={isLoading}
						onClick={async () => {
							await postDemoMonitors("/monitors/demo", {});
						}}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("pages.settings.demoMonitorsSettings.buttonAddMonitors")}
					</Button>
				</Box>
			</ConfigBox>
			<ConfigBox>
				<Box>
					<Typography
						component="h1"
						variant="h2"
					>
						{t("pages.settings.systemResetSettings.title")}
					</Typography>
					<Typography sx={{ mt: theme.spacing(2) }}>
						{t("pages.settings.systemResetSettings.description")}
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
						{t("pages.settings.systemResetSettings.buttonRemoveAllMonitors")}
					</Button>
				</Box>
				<Dialog
					open={isOpen}
					theme={theme}
					title={t("pages.settings.systemResetSettings.dialogTitle")}
					onCancel={() => setIsOpen(false)}
					confirmationButtonLabel={t("pages.settings.systemResetSettings.dialogConfirm")}
					onConfirm={async () => {
						await deleteAllMonitorsFn("/monitors/");
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
	HEADER_SX: PropTypes.object,
};

export default SettingsDemoMonitors;
