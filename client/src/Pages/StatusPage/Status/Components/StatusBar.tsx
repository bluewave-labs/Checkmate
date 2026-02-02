import { AlertTriangle, CircleCheck } from "lucide-react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import type { Theme } from "@mui/material";
import { useTheme } from "@mui/material";
import type { Monitor } from "@/Types/Monitor";

const getMonitorStatus = (monitors: Monitor[], theme: Theme, t: Function) => {
	const monitorsStatus: Record<string, any> = {
		icon: <AlertTriangle size={24} />,
	};

	if (monitors.every((monitor) => monitor.status === true)) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allUp");
		monitorsStatus.color = theme.palette.success.main;
		monitorsStatus.icon = <CircleCheck size={24} />;
	}

	if (monitors.every((monitor) => monitor.status === false)) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allDown");
		monitorsStatus.color = theme.palette.error.main;
	}

	if (monitors.some((monitor) => monitor.status === false)) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.degraded");
		monitorsStatus.color = theme.palette.warning.main;
	}

	// Paused or unknown
	if (monitors.some((monitor) => typeof monitor.status === "undefined")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.unknown");
		monitorsStatus.color = theme.palette.warning.main;
	}
	return monitorsStatus;
};

interface StatusBarProps {
	monitors: Monitor[];
}

export const StatusBar = ({ monitors }: StatusBarProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const monitorsStatus = getMonitorStatus(monitors, theme, t);

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			gap={theme.spacing(2)}
			height={theme.spacing(30)}
			bgcolor={monitorsStatus.color}
			borderRadius={theme.shape.borderRadius}
		>
			{monitorsStatus.icon}
			<Typography>{monitorsStatus.msg}</Typography>
		</Stack>
	);
};
