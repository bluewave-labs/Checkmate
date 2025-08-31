import { Alert, AlertTitle, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const MaintenanceBanner = ({ affectedMonitors }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	if (!affectedMonitors || affectedMonitors.length === 0) {
		return null;
	}

	const monitorNames = affectedMonitors.map(monitor => monitor.name).join(", ");

	return (
		<Alert 
			severity="warning" 
			sx={{ 
				mb: theme.spacing(10),
				'& .MuiAlert-icon': {
					fontSize: '1.5rem'
				}
			}}
		>
			<AlertTitle sx={{ fontWeight: 600, mb: theme.spacing(5) }}>
				🔧 {t("maintenanceInProgress")}
			</AlertTitle>
			<Typography variant="body2" sx={{ mb: theme.spacing(5) }}>
				{t("maintenanceAffectedServices")}: <strong>{monitorNames}</strong>
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{t("maintenanceNoAlertsGenerated")}
			</Typography>
		</Alert>
	);
};

export default MaintenanceBanner;