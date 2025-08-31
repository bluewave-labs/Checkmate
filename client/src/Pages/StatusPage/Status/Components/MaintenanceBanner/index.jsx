import { Alert, AlertTitle, Typography } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useTranslation } from "react-i18next";

const MaintenanceBanner = ({ affectedMonitors }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	// DEMO MODE: Show example banner if no real maintenance data
	const isDemoMode = !affectedMonitors || affectedMonitors.length === 0;
	const demoMonitors = [
		{ name: "Web Server" },
		{ name: "API Gateway" }
	];
	
	const monitorsToShow = isDemoMode ? demoMonitors : affectedMonitors;
	const monitorNames = monitorsToShow.map(monitor => monitor.name).join(", ");

	// Show demo banner for testing, remove this condition in production
	if (!isDemoMode && monitorsToShow.length === 0) {
		return null;
	}

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
				🔧 {t("maintenanceInProgress")} {isDemoMode && "(DEMO)"}
			</AlertTitle>
			<Typography variant="body2" sx={{ mb: theme.spacing(5) }}>
				{t("maintenanceAffectedServices")}: <strong>{monitorNames}</strong>
			</Typography>
			<Typography variant="body2" color="text.secondary">
				{t("maintenanceNoAlertsGenerated")}
			</Typography>
			{isDemoMode && (
				<Typography variant="caption" color="text.secondary" sx={{ mt: theme.spacing(5), fontStyle: 'italic' }}>
					This is a demo banner showing how maintenance notifications appear.
				</Typography>
			)}
		</Alert>
	);
};

export default MaintenanceBanner;