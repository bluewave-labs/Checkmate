import {
	AlertTriangle,
	CircleCheck,
	CircleX, Loader,
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

interface StatusDisplay {
	icon: JSX.Element;
	msg?: string;
	color?: string;
}

const getMonitorStatus = (monitors: Monitor[], theme: Theme, t: Function) => {
	const monitorsStatus: StatusDisplay = {
		icon: <AlertTriangle size={24} />,
	};

	// Handle empty monitors array
	if (monitors.length === 0) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.noMonitors");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <CircleX size={24} />;
		return monitorsStatus;
	}

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
		monitorsStatus.color = theme.palette.error.main;
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
	} else if (allOf("initializing")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.allInitializing");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <Loader size={24} />;

		// Breached takes highest priority in mixed states
	} else if (someOf("breached") && someOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.breachedAndDown");
		monitorsStatus.color = theme.palette.error.main;
		monitorsStatus.icon = <ShieldAlert size={24} />;
	} else if (someOf("breached")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.breached");
		monitorsStatus.color = theme.palette.error.main;
		monitorsStatus.icon = <ShieldAlert size={24} />;

		// Maintenance combinations
	} else if (someOf("maintenance") && someOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.maintenanceAndDown");
		monitorsStatus.color = theme.palette.error.main;
		monitorsStatus.icon = <Wrench size={24} />;
	} else if (someOf("maintenance") && noneOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.maintenance");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <Wrench size={24} />;

		// Degraded (some down, no maintenance/breached)
	} else if (someOf("down")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.degraded");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <AlertTriangle size={24} />;

		// Some Paused
	} else if (someOf("paused")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.partiallyPaused");
		monitorsStatus.color = theme.palette.warning.main;
		monitorsStatus.icon = <PauseCircle size={24} />;

		// Initializing
	} else if (someOf("initializing")) {
		monitorsStatus.msg = t("pages.statusPages.statusBar.initializing");
		monitorsStatus.color = theme.palette.info.main;
		monitorsStatus.icon = <Loader size={24} />;
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
