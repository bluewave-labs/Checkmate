import { Icon } from "@/Components/v2/design-elements";

import {
	Globe,
	Gauge,
	Link,
	Bell,
	FileText,
	AlertTriangle,
	Wifi,
	Wrench,
	Database,
	Settings,
	HelpCircle,
	MessageCircle,
	Code,
	User,
	Lock,
	Users,
} from "lucide-react";

export const getMenu = (t: Function) => {
	return [
		{ name: t("menu.uptime"), path: "uptime", icon: <Icon icon={Globe} /> },
		{ name: t("menu.pagespeed"), path: "pagespeed", icon: <Icon icon={Gauge} /> },
		{
			name: t("menu.infrastructure"),
			path: "infrastructure",
			icon: <Icon icon={Link} />,
		},
		{
			name: t("menu.notifications"),
			path: "notifications",
			icon: <Icon icon={Bell} />,
		},
		{ name: t("menu.checks"), path: "checks", icon: <Icon icon={FileText} /> },
		{ name: t("menu.incidents"), path: "incidents", icon: <Icon icon={AlertTriangle} /> },
		{ name: t("menu.statusPages"), path: "status", icon: <Icon icon={Wifi} /> },
		{ name: t("menu.maintenance"), path: "maintenance", icon: <Icon icon={Wrench} /> },
		{ name: t("menu.logs"), path: "logs", icon: <Icon icon={Database} /> },
		{
			name: t("menu.settings"),
			icon: <Icon icon={Settings} />,
			path: "settings",
		},
	];
};

export const getBottomMenu = (t: Function) => {
	return [
		{ name: t("menu.support"), path: "support", icon: <Icon icon={HelpCircle} /> },
		{
			name: t("menu.discussions"),
			path: "discussions",
			icon: <Icon icon={MessageCircle} />,
		},
		{ name: t("menu.docs"), path: "docs", icon: <Icon icon={FileText} /> },
		{ name: t("menu.changelog"), path: "changelog", icon: <Icon icon={Code} /> },
	];
};
