import Stack from "@mui/material/Stack";

import List from "@mui/material/List";
import Logo from "./logo";
import CollapseButton from "./collapseButton";
import Divider from "@mui/material/Divider";
import NavItem from "./components/navItem";
import AuthFooter from "./components/authFooter";

import StarPrompt from "../StarPrompt";
import LockSvg from "../../assets/icons/lock.svg?react";
import UserSvg from "../../assets/icons/user.svg?react";
import TeamSvg from "../../assets/icons/user-two.svg?react";
import Support from "../../assets/icons/support.svg?react";
import Maintenance from "../../assets/icons/maintenance.svg?react";
import Monitors from "../../assets/icons/monitors.svg?react";
import Incidents from "../../assets/icons/incidents.svg?react";
import Integrations from "../../assets/icons/integrations.svg?react";
import PageSpeed from "../../assets/icons/page-speed.svg?react";
import Settings from "../../assets/icons/settings.svg?react";
import ChangeLog from "../../assets/icons/changeLog.svg?react";
import Docs from "../../assets/icons/docs.svg?react";
import StatusPages from "../../assets/icons/status-pages.svg?react";
import Discussions from "../../assets/icons/discussions.svg?react";
import Notifications from "../../assets/icons/notifications.svg?react";
import Logs from "../../assets/icons/logs.svg?react";

// Utils
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

const URL_MAP = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	discussions: "https://github.com/bluewave-labs/checkmate/discussions",
	docs: "https://bluewavelabs.gitbook.io/checkmate",
	changelog: "https://github.com/bluewave-labs/checkmate/releases",
};

const getMenu = (t) => [
	{ name: t("menu.uptime"), path: "uptime", icon: <Monitors /> },
	{ name: t("menu.pagespeed"), path: "pagespeed", icon: <PageSpeed /> },

	{ name: t("menu.infrastructure"), path: "infrastructure", icon: <Integrations /> },
	{
		name: t("menu.notifications"),
		path: "notifications",
		icon: <Notifications />,
	},
	{ name: t("menu.incidents"), path: "incidents", icon: <Incidents /> },

	{ name: t("menu.statusPages"), path: "status", icon: <StatusPages /> },
	{ name: t("menu.maintenance"), path: "maintenance", icon: <Maintenance /> },
	{ name: t("menu.logs"), path: "logs", icon: <Logs /> },

	{
		name: t("menu.settings"),
		icon: <Settings />,
		path: "settings",
	},
];

const getOtherMenuItems = (t) => [
	{ name: t("menu.support"), path: "support", icon: <Support /> },
	{
		name: t("menu.discussions"),
		path: "discussions",
		icon: <Discussions />,
	},
	{ name: t("menu.docs"), path: "docs", icon: <Docs /> },
	{ name: t("menu.changelog"), path: "changelog", icon: <ChangeLog /> },
];

const getAccountMenuItems = (t) => [
	{ name: t("menu.profile"), path: "account/profile", icon: <UserSvg /> },
	{ name: t("menu.password"), path: "account/password", icon: <LockSvg /> },
	{ name: t("menu.team"), path: "account/team", icon: <TeamSvg /> },
];

const Sidebar = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	// Redux state
	const collapsed = useSelector((state) => state.ui.sidebar.collapsed);

	const menu = getMenu(t);
	const otherMenuItems = getOtherMenuItems(t);
	const accountMenuItems = getAccountMenuItems(t);

	return (
		<Stack
			width={collapsed ? "64px" : "var(--env-var-side-bar-width)"}
			component="aside"
			position="relative"
			borderRight={`1px solid ${theme.palette.primary.lowContrast}`}
			paddingTop={theme.spacing(6)}
			paddingBottom={theme.spacing(6)}
			gap={theme.spacing(6)}
			sx={{
				transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
			}}
		>
			<CollapseButton collapsed={collapsed} />
			<Logo collapsed={collapsed} />
			<List
				component="nav"
				aria-labelledby="nested-menu-subheader"
				disablePadding
				sx={{
					px: theme.spacing(6),
					height: "100%",
				}}
			>
				{menu.map((item) => {
					const selected = location.pathname.startsWith(`/${item.path}`);
					return (
						<NavItem
							key={item.path}
							item={item}
							collapsed={collapsed}
							selected={selected}
							onClick={() => navigate(`/${item.path}`)}
						/>
					);
				})}
			</List>
			{!collapsed && <StarPrompt />}
			<List
				component="nav"
				disablePadding
				sx={{ px: theme.spacing(6) }}
			>
				{otherMenuItems.map((item) => {
					const selected = location.pathname.startsWith(`/${item.path}`);

					return (
						<NavItem
							key={item.path}
							item={item}
							collapsed={collapsed}
							selected={selected}
							onClick={() => {
								const url = URL_MAP[item.path];
								if (url) {
									window.open(url, "_blank", "noreferrer");
								} else {
									navigate(`/${item.path}`);
								}
							}}
						/>
					);
				})}
			</List>
			<Divider sx={{ mt: "auto", borderColor: theme.palette.primary.lowContrast }} />
			<AuthFooter
				collapsed={collapsed}
				accountMenuItems={accountMenuItems}
			/>
		</Stack>
	);
};

export default Sidebar;
