import {
	AlertTriangle,
	CircleCheck,
	CircleX,
	Loader,
	PauseCircle,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import type { Monitor, MonitorStatus } from "@/Types/Monitor";

type SemanticTone = "up" | "down" | "warn" | "info";

interface StatusDisplay {
	icon: JSX.Element;
	msg?: string;
	tone: SemanticTone;
}

const getMonitorStatus = (monitors: Monitor[], t: Function): StatusDisplay => {
	if (monitors.length === 0) {
		return {
			msg: t("pages.statusPages.statusBar.noMonitors"),
			tone: "warn",
			icon: <CircleX size={24} />,
		};
	}

	const allOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => statuses.includes(m.status));
	const someOf = (...statuses: MonitorStatus[]) =>
		monitors.some((m) => statuses.includes(m.status));
	const noneOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => !statuses.includes(m.status));

	if (allOf("up")) {
		return {
			msg: t("pages.statusPages.statusBar.allUp"),
			tone: "up",
			icon: <CircleCheck size={24} />,
		};
	}
	if (allOf("breached")) {
		return {
			msg: t("pages.statusPages.statusBar.allBreached"),
			tone: "down",
			icon: <ShieldAlert size={24} />,
		};
	}
	if (allOf("maintenance")) {
		return {
			msg: t("pages.statusPages.statusBar.allMaintenance"),
			tone: "warn",
			icon: <Wrench size={24} />,
		};
	}
	if (allOf("down")) {
		return {
			msg: t("pages.statusPages.statusBar.allDown"),
			tone: "down",
			icon: <CircleX size={24} />,
		};
	}
	if (allOf("paused")) {
		return {
			msg: t("pages.statusPages.statusBar.allPaused"),
			tone: "warn",
			icon: <PauseCircle size={24} />,
		};
	}
	if (allOf("initializing")) {
		return {
			msg: t("pages.statusPages.statusBar.allInitializing"),
			tone: "warn",
			icon: <Loader size={24} />,
		};
	}

	// Breached takes highest priority in mixed states
	if (someOf("breached") && someOf("down")) {
		return {
			msg: t("pages.statusPages.statusBar.breachedAndDown"),
			tone: "down",
			icon: <ShieldAlert size={24} />,
		};
	}
	if (someOf("breached")) {
		return {
			msg: t("pages.statusPages.statusBar.breached"),
			tone: "down",
			icon: <ShieldAlert size={24} />,
		};
	}
	if (someOf("maintenance") && someOf("down")) {
		return {
			msg: t("pages.statusPages.statusBar.maintenanceAndDown"),
			tone: "down",
			icon: <Wrench size={24} />,
		};
	}
	if (someOf("maintenance") && noneOf("down")) {
		return {
			msg: t("pages.statusPages.statusBar.maintenance"),
			tone: "warn",
			icon: <Wrench size={24} />,
		};
	}
	if (someOf("down")) {
		return {
			msg: t("pages.statusPages.statusBar.degraded"),
			tone: "warn",
			icon: <AlertTriangle size={24} />,
		};
	}
	if (someOf("paused")) {
		return {
			msg: t("pages.statusPages.statusBar.partiallyPaused"),
			tone: "warn",
			icon: <PauseCircle size={24} />,
		};
	}
	if (someOf("initializing")) {
		return {
			msg: t("pages.statusPages.statusBar.initializing"),
			tone: "info",
			icon: <Loader size={24} />,
		};
	}

	return {
		msg: t("pages.statusPages.statusBar.unknown"),
		tone: "warn",
		icon: <AlertTriangle size={24} />,
	};
};

const toneToCssVar: Record<SemanticTone, string> = {
	up: "var(--sp-up)",
	down: "var(--sp-down)",
	warn: "var(--sp-warn)",
	info: "var(--sp-up)",
};

interface StatusBarProps {
	monitors: Monitor[];
}

export const StatusBar = ({ monitors }: StatusBarProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const monitorsStatus = getMonitorStatus(monitors, t);

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			gap={theme.spacing(2)}
			height={theme.spacing(30)}
			bgcolor={toneToCssVar[monitorsStatus.tone]}
			borderRadius={theme.shape.borderRadius}
			className="sp-hero"
		>
			{monitorsStatus.icon}
			<Typography className="sp-hero-title">{monitorsStatus.msg}</Typography>
		</Stack>
	);
};
