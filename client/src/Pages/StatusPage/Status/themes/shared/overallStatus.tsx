import type { ReactNode } from "react";
import {
	AlertTriangle,
	CircleCheck,
	CircleX,
	Loader,
	PauseCircle,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import type { Monitor, MonitorStatus } from "@/Types/Monitor";

export type OverallTone = "up" | "warn" | "down";

export interface OverallStatus {
	tone: OverallTone;
	message: string;
	icon: ReactNode;
}

type StatusPageMonitor = Pick<Monitor, "status">;

interface Options {
	iconSize?: number;
	// Optional override for the `allUp` message key (editorial uses a more
	// formal sentence).
	allUpKey?: string;
}

export const resolveOverallStatus = (
	monitors: StatusPageMonitor[],
	t: (key: string) => string,
	options: Options = {}
): OverallStatus => {
	const size = options.iconSize ?? 18;
	const allUpMessage = t(options.allUpKey ?? "pages.statusPages.statusBar.allUp");

	if (monitors.length === 0) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.noMonitors"),
			icon: <CircleX size={size} />,
		};
	}

	const allOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => statuses.includes(m.status));
	const someOf = (...statuses: MonitorStatus[]) =>
		monitors.some((m) => statuses.includes(m.status));
	const noneOf = (...statuses: MonitorStatus[]) =>
		monitors.every((m) => !statuses.includes(m.status));

	if (allOf("up")) {
		return { tone: "up", message: allUpMessage, icon: <CircleCheck size={size} /> };
	}
	if (allOf("breached")) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.allBreached"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (allOf("maintenance")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allMaintenance"),
			icon: <Wrench size={size} />,
		};
	}
	if (allOf("down")) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.allDown"),
			icon: <CircleX size={size} />,
		};
	}
	if (allOf("paused")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allPaused"),
			icon: <PauseCircle size={size} />,
		};
	}
	if (allOf("initializing")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allInitializing"),
			icon: <Loader size={size} />,
		};
	}
	if (someOf("breached") && someOf("down")) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.breachedAndDown"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (someOf("breached")) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.breached"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (someOf("maintenance") && someOf("down")) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.maintenanceAndDown"),
			icon: <Wrench size={size} />,
		};
	}
	if (someOf("maintenance") && noneOf("down")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.maintenance"),
			icon: <Wrench size={size} />,
		};
	}
	if (someOf("down")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.degraded"),
			icon: <AlertTriangle size={size} />,
		};
	}
	if (someOf("paused")) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.partiallyPaused"),
			icon: <PauseCircle size={size} />,
		};
	}
	if (someOf("initializing")) {
		return {
			tone: "up",
			message: t("pages.statusPages.statusBar.initializing"),
			icon: <Loader size={size} />,
		};
	}
	return {
		tone: "warn",
		message: t("pages.statusPages.statusBar.unknown"),
		icon: <AlertTriangle size={size} />,
	};
};

export const statusBadgeKey: Record<MonitorStatus, string> = {
	up: "pages.statusPages.monitorsList.status.up",
	down: "pages.statusPages.monitorsList.status.down",
	breached: "pages.statusPages.monitorsList.status.breached",
	maintenance: "pages.statusPages.monitorsList.status.maintenance",
	paused: "pages.statusPages.monitorsList.status.paused",
	initializing: "pages.statusPages.monitorsList.status.initializing",
};

export const monoFirstChar = (s?: string): string =>
	(s?.trim().charAt(0) || "?").toUpperCase();

export const monitorBadgeTone = (status: MonitorStatus): OverallTone =>
	status === "up" ? "up" : status === "down" || status === "breached" ? "down" : "warn";
