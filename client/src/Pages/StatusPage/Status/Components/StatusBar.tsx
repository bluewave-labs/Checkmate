import {
	AlertTriangle,
	CircleCheck,
	CircleX,
	PauseCircle,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Theme } from "@mui/material";
import type { Monitor, MonitorStatus } from "@/Types/Monitor";

const getMonitorStatus = (monitors: Monitor[], theme: Theme, t: Function) => {
	const monitorsStatus: Record<string, any> = {
		icon: <AlertTriangle size={24} />,
	};

	const allOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => statuses.includes(m.status));
	const someOf = (...statuses: MonitorStatus[]) =>
		monitors.some((m) => statuses.includes(m.status));
	const noneOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => !statuses.includes(m.status));

	// All monitors in a single state
	if (allOf("up")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allUp");
		monitorsStatus.color = theme.palette.success.main;
		monitorsStatus.icon = <CircleCheck size={24} />;
	} else if (allOf("breached")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allBreached");
		monitorsStatus.color = theme.palette.error.dark;
		monitorsStatus.icon = <ShieldAlert size={24} />;
	} else if (allOf("maintenance")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allMaintenance");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <Wrench size={24} />;
	} else if (allOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allDown");
		monitorsStatus.color = theme.palette.error.main;
		monitorsStatus.icon = <CircleX size={24} />;
	} else if (allOf("paused")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allPaused");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <PauseCircle size={24} />;

		// Breached takes highest priority in mixed states
	} else if (someOf("breached") && someOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.breachedAndDown");
		monitorsStatus.color = theme.palette.error.dark;
		monitorsStatus.icon = <ShieldAlert size={24} />;
	} else if (someOf("breached")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.breached");
		monitorsStatus.color = theme.palette.error.dark;
		monitorsStatus.icon = <ShieldAlert size={24} />;

		// Maintenance combinations
	} else if (someOf("maintenance") && someOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.maintenanceAndDown");
		monitorsStatus.color = theme.palette.error.main;
		monitorsStatus.icon = <Wrench size={24} />;
	} else if (someOf("maintenance") && noneOf("down", "breached")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.maintenance");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <Wrench size={24} />;

		// Degraded (some down, no maintenance/breached)
	} else if (someOf("down") && noneOf("maintenance", "breached")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.degraded");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <AlertTriangle size={24} />;

		// Some Paused
	} else if (someOf("paused") && noneOf("down", "breached", "maintenance")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.partiallyPaused");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <PauseCircle size={24} />;

	} else {
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
