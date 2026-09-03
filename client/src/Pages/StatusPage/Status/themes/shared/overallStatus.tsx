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
import { MonitorStatus } from "@/Types/Monitor";
import type { Monitor } from "@/Types/Monitor";
import type { StatusPageThemeTokens } from "../tokens";

export type OverallTone = "up" | "warn" | "down";

export const toneColor = (tone: OverallTone, t: StatusPageThemeTokens): string =>
	tone === "down" ? t.down : tone === "warn" ? t.warn : t.up;

export const toneSoft = (tone: OverallTone, t: StatusPageThemeTokens): string =>
	tone === "down" ? t.downSoft : tone === "warn" ? t.warnSoft : t.upSoft;

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

	if (allOf(MonitorStatus.Up)) {
		return { tone: "up", message: allUpMessage, icon: <CircleCheck size={size} /> };
	}
	if (allOf(MonitorStatus.Breached)) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.allBreached"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (allOf(MonitorStatus.Maintenance)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allMaintenance"),
			icon: <Wrench size={size} />,
		};
	}
	if (allOf(MonitorStatus.Down)) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.allDown"),
			icon: <CircleX size={size} />,
		};
	}
	if (allOf(MonitorStatus.Paused)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allPaused"),
			icon: <PauseCircle size={size} />,
		};
	}
	if (allOf(MonitorStatus.Initializing)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.allInitializing"),
			icon: <Loader size={size} />,
		};
	}
	if (someOf(MonitorStatus.Breached) && someOf(MonitorStatus.Down)) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.breachedAndDown"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (someOf(MonitorStatus.Breached)) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.breached"),
			icon: <ShieldAlert size={size} />,
		};
	}
	if (someOf(MonitorStatus.Maintenance) && someOf(MonitorStatus.Down)) {
		return {
			tone: "down",
			message: t("pages.statusPages.statusBar.maintenanceAndDown"),
			icon: <Wrench size={size} />,
		};
	}
	if (someOf(MonitorStatus.Maintenance) && noneOf(MonitorStatus.Down)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.maintenance"),
			icon: <Wrench size={size} />,
		};
	}
	if (someOf(MonitorStatus.Down)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.degraded"),
			icon: <AlertTriangle size={size} />,
		};
	}
	if (someOf(MonitorStatus.Paused)) {
		return {
			tone: "warn",
			message: t("pages.statusPages.statusBar.partiallyPaused"),
			icon: <PauseCircle size={size} />,
		};
	}
	if (someOf(MonitorStatus.Initializing)) {
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
	[MonitorStatus.Up]: "pages.statusPages.monitorsList.status.up",
	[MonitorStatus.Down]: "pages.statusPages.monitorsList.status.down",
	[MonitorStatus.Breached]: "pages.statusPages.monitorsList.status.breached",
	[MonitorStatus.Maintenance]: "pages.statusPages.monitorsList.status.maintenance",
	[MonitorStatus.Paused]: "pages.statusPages.monitorsList.status.paused",
	[MonitorStatus.Initializing]: "pages.statusPages.monitorsList.status.initializing",
};

export const monoFirstChar = (s?: string): string =>
	(s?.trim().charAt(0) || "?").toUpperCase();

export const monitorBadgeTone = (status: MonitorStatus): OverallTone =>
	status === MonitorStatus.Up
		? MonitorStatus.Up
		: status === MonitorStatus.Down || status === MonitorStatus.Breached
			? MonitorStatus.Down
			: "warn";
