import { Alert, AlertTitle, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

const MaintenanceBanner = ({ affectedMonitors }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	// Only show banner if there are monitors in maintenance
	if (!affectedMonitors || affectedMonitors.length === 0) {
		return null;
	}

	const monitorNames = affectedMonitors.map((monitor) => monitor.name).join(", ");

	return (
		<Alert
			severity="warning"
			sx={{
				mb: theme.spacing(10),
				"& .MuiAlert-icon": {
					fontSize: "1.5rem",
				},
			}}
		>
			<AlertTitle sx={{ fontWeight: 600, mb: theme.spacing(5) }}>
				{t("maintenanceInProgress")}
			</AlertTitle>
			<Typography variant="body2">
				{t("maintenanceAffectedServices")}: <strong>{monitorNames}</strong>
			</Typography>
		</Alert>
	);
};

MaintenanceBanner.propTypes = {
	affectedMonitors: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
		})
	),
};

export default MaintenanceBanner;
