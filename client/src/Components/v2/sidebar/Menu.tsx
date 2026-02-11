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
		{
			name: t("components.sidebar.menu.uptime"),
			path: "uptime",
			icon: <Icon icon={Globe} />,
		},
		{
			name: t("components.sidebar.menu.pagespeed"),
			path: "pagespeed",
			icon: <Icon icon={Gauge} />,
		},
		{
			name: t("components.sidebar.menu.infrastructure"),
			path: "infrastructure",
			icon: <Icon icon={Link} />,
		},
		{
			name: t("components.sidebar.menu.notifications"),
			path: "notifications",
			icon: <Icon icon={Bell} />,
		},
		{
			name: t("components.sidebar.menu.checks"),
			path: "checks",
			icon: <Icon icon={FileText} />,
		},
		{
			name: t("components.sidebar.menu.incidents"),
			path: "incidents",
			icon: <Icon icon={AlertTriangle} />,
		},
		{
			name: t("components.sidebar.menu.statusPages"),
			path: "status",
			icon: <Icon icon={Wifi} />,
		},
		{
			name: t("components.sidebar.menu.maintenance"),
			path: "maintenance",
			icon: <Icon icon={Wrench} />,
		},
		{
			name: t("components.sidebar.menu.logs"),
			path: "logs",
			icon: <Icon icon={Database} />,
		},
		{
			name: t("components.sidebar.menu.settings"),
			icon: <Icon icon={Settings} />,
			path: "settings",
		},
	];
};

export const getBottomMenu = (t: Function) => {
	return [
		{
			name: t("components.sidebar.bottomMenu.support"),
			path: "support",
			icon: <Icon icon={HelpCircle} />,
		},
		{
			name: t("components.sidebar.bottomMenu.discussions"),
			path: "discussions",
			icon: <Icon icon={MessageCircle} />,
		},
		{
			name: t("components.sidebar.bottomMenu.docs"),
			path: "docs",
			icon: <Icon icon={FileText} />,
		},
		{
			name: t("components.sidebar.bottomMenu.changelog"),
			path: "changelog",
			icon: <Icon icon={Code} />,
		},
	];
};

export const getAccountMenu = (t: Function) => {
	return [
		{
			name: t("components.sidebar.accountMenu.profile"),
			path: "account/profile",
			icon: <Icon icon={User} />,
		},
		{
			name: t("components.sidebar.accountMenu.password"),
			path: "account/password",
			icon: <Icon icon={Lock} />,
		},
		{
			name: t("components.sidebar.accountMenu.team"),
			path: "account/team",
			icon: <Icon icon={Users} />,
		},
	];
};
