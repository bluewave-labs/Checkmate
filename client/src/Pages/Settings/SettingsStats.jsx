import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ConfigBox from "@/Components/v1/ConfigBox/index.jsx";
import TextInput from "@/Components/v1/Inputs/TextInput/index.jsx";
import Dialog from "@/Components/v1/Dialog/index.jsx";

// Utils
import { useTheme } from "@emotion/react";
import { PropTypes } from "prop-types";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDelete } from "@/Hooks/UseApi";

const SettingsStats = ({ isAdmin, HEADING_SX, errors }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	if (!isAdmin) {
		return null;
	}
	const { deleteFn: deleteMonitorStatsFn } = useDelete();

	return (
		<ConfigBox>
			<Box>
				<Typography
					component="h1"
					variant="h2"
					sx={HEADING_SX}
				>
					{t("pages.settings.statsSettings.title")}
				</Typography>
				<Typography sx={{ mt: theme.spacing(2) }}>
					{t("pages.settings.statsSettings.description")}
				</Typography>
			</Box>
			<Stack gap={theme.spacing(20)}>
				<Box>
					<Typography>
						{t("pages.settings.statsSettings.clearAllStatsDescription")}
					</Typography>
					<Button
						variant="contained"
						color="error"
						onClick={() => setIsOpen(true)}
						sx={{ mt: theme.spacing(4) }}
					>
						{t("pages.settings.statsSettings.clearAllStatsButton")}
					</Button>
				</Box>
			</Stack>
			<Dialog
				open={isOpen}
				theme={theme}
				title={t("pages.settings.statsSettings.clearAllStatsDialogTitle")}
				description={t("pages.settings.statsSettings.clearAllStatsDialogDescription")}
				onCancel={() => setIsOpen(false)}
				confirmationButtonLabel={t(
					"pages.settings.statsSettings.clearAllStatsDialogConfirm"
				)}
				onConfirm={async () => {
					await deleteMonitorStatsFn("/checks/team");

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
};

export default SettingsStats;
