// import Notifications from "@/assets/icons/notifications.svg?react";
import Monitors from "@/assets/icons/monitors.svg?react";
// import PageSpeed from "@/assets/icons/page-speed.svg?react";
// import Integrations from "@/assets/icons/integrations.svg?react";
// import Incidents from "@/assets/icons/incidents.svg?react";
// import StatusPages from "@/assets/icons/status-pages.svg?react";
// import Maintenance from "@/assets/icons/maintenance.svg?react";
// import Logs from "@/assets/icons/logs.svg?react";
// import Settings from "@/assets/icons/settings.svg?react";
import Support from "@/assets/icons/support.svg?react";
import Discussions from "@/assets/icons/discussions.svg?react";
import Docs from "@/assets/icons/docs.svg?react";
import ChangeLog from "@/assets/icons/changeLog.svg?react";

export const getMenu = (t: Function) => [
	{ name: t("menu.uptime"), path: "v2/uptime", icon: <Monitors /> },
	// { name: t("menu.pagespeed"), path: "pagespeed", icon: <PageSpeed /> },

	// { name: t("menu.infrastructure"), path: "infrastructure", icon: <Integrations /> },
	// {
	// 	name: t("menu.notifications"),
	// 	path: "notifications",
	// 	icon: <Notifications />,
	// },
	// { name: t("menu.incidents"), path: "incidents", icon: <Incidents /> },

	// { name: t("menu.statusPages"), path: "status", icon: <StatusPages /> },
	// { name: t("menu.maintenance"), path: "maintenance", icon: <Maintenance /> },
	// { name: t("menu.logs"), path: "logs", icon: <Logs /> },

	// {
	// 	name: t("menu.settings"),
	// 	icon: <Settings />,
	// 	path: "settings",
	// },
];

export const getBottomMenu = (t: Function) => [
	{ name: t("menu.support"), path: "support", icon: <Support />, url: "invite" },
	{
		name: t("menu.discussions"),
		path: "discussions",
		icon: <Discussions />,
		url: "https://github.com/bluewave-labs/checkmate/discussions",
	},
	{
		name: t("menu.docs"),
		path: "docs",
		icon: <Docs />,
		url: "https://bluewavelabs.gitbook.io/checkmate",
	},
	{
		name: t("menu.changelog"),
		path: "changelog",
		icon: <ChangeLog />,
		url: "https://github.com/bluewave-labs/checkmate/releases",
	},
];
