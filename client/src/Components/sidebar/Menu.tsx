import { Icon } from "@/Components/design-elements";

import {
	Globe,
	Gauge,
	Link,
	Bell,
	FileText,
	AlertTriangle,
	Wifi,
	Wrench,
	ScrollText,
	Settings,
	User,
	Lock,
	Users,
	Container,
	LayoutDashboard,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { NavData } from "@/Components/sidebar/NavItem";
import type { UserRole } from "@/Types/User";
import type { SidebarGroupKey } from "@/Utils/Theme/Palette";

export interface SidebarMenuItem extends NavData {
	path: string;
	roles?: UserRole[];
	// Other path prefixes that also mark this item as the current page
	activePaths?: string[];
}

export interface SidebarMenuGroup {
	group: string;
	// Wayfinding tint for the heading and icons; ungrouped (grey) when absent
	groupKey?: SidebarGroupKey;
	items: SidebarMenuItem[];
}

const isVisible = (item: SidebarMenuItem, userRoles: UserRole[]) =>
	!item.roles || item.roles.some((role) => userRoles.includes(role));

export const getMenu = (t: TFunction, userRoles: UserRole[]): SidebarMenuGroup[] => {
	const menu: SidebarMenuGroup[] = [
		{
			group: t("components.sidebar.menu.groups.monitoring"),
			groupKey: "monitoring",
			items: [
				{
					name: t("components.sidebar.menu.dashboard"),
					path: "dashboard",
					icon: <Icon icon={LayoutDashboard} />,
				},
				{
					name: t("components.sidebar.menu.uptime"),
					path: "uptime",
					icon: <Icon icon={Globe} />,
				},
				{
					name: t("components.sidebar.menu.docker"),
					path: "docker",
					icon: <Icon icon={Container} />,
				},
				{
					name: t("components.sidebar.menu.infrastructure"),
					path: "infrastructure",
					icon: <Icon icon={Link} />,
				},
				{
					name: t("components.sidebar.menu.pagespeed"),
					path: "pagespeed",
					icon: <Icon icon={Gauge} />,
				},
			],
		},
		{
			group: t("components.sidebar.menu.groups.alerting"),
			groupKey: "alerting",
			items: [
				{
					name: t("components.sidebar.menu.incidents"),
					path: "incidents",
					icon: <Icon icon={AlertTriangle} />,
				},
				{
					name: t("components.sidebar.menu.notifications"),
					path: "notifications",
					icon: <Icon icon={Bell} />,
				},
				{
					name: t("components.sidebar.menu.maintenance"),
					path: "maintenance",
					icon: <Icon icon={Wrench} />,
				},
			],
		},
		{
			group: t("components.sidebar.menu.groups.reporting"),
			groupKey: "reporting",
			items: [
				{
					name: t("components.sidebar.menu.statusPages"),
					path: "status",
					icon: <Icon icon={Wifi} />,
				},
				{
					name: t("components.sidebar.menu.checks"),
					path: "checks",
					icon: <Icon icon={FileText} />,
				},
				{
					name: t("components.sidebar.menu.logs"),
					path: "logs",
					icon: <Icon icon={ScrollText} />,
					roles: ["admin", "superadmin"],
				},
			],
		},
		{
			group: t("components.sidebar.menu.groups.configuration"),
			items: [
				{
					name: t("components.sidebar.menu.settings"),
					path: "settings",
					icon: <Icon icon={Settings} />,
					// Tags and proxies are Settings tabs; their create/edit pages keep their own paths
					activePaths: ["tags", "proxies"],
				},
			],
		},
	];
	return menu.map((group) => ({
		...group,
		items: group.items.filter((item) => isVisible(item, userRoles)),
	}));
};

export const getAccountMenu = (
	t: TFunction,
	userRoles: UserRole[]
): SidebarMenuItem[] => {
	const menu: SidebarMenuItem[] = [
		{
			name: t("components.sidebar.accountMenu.profile"),
			path: "account/profile",
			icon: <Icon icon={User} />,
		},
		{
			name: t("components.sidebar.accountMenu.password"),
			path: "account/password",
			icon: <Icon icon={Lock} />,
			roles: ["user", "admin", "superadmin"],
		},
		{
			name: t("components.sidebar.accountMenu.team"),
			path: "account/team",
			icon: <Icon icon={Users} />,
			roles: ["admin", "superadmin"],
		},
	];
	return menu.filter((item) => isVisible(item, userRoles));
};
