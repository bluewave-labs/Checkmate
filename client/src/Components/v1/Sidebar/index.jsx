import Stack from "@mui/material/Stack";

import List from "@mui/material/List";
import Logo from "./components/logo.jsx";
import CollapseButton from "./components/collapseButton.jsx";
import Divider from "@mui/material/Divider";
import NavItem from "./components/navItem.jsx";
import AuthFooter from "./components/authFooter.jsx";

import StarPrompt from "../StarPrompt/index.jsx";
import Icon from "../Icon";

// Utils
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useSidebar } from "@/Hooks/useSidebar.js";

const URL_MAP = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	discussions: "https://github.com/bluewave-labs/checkmate/discussions",
	docs: "https://bluewavelabs.gitbook.io/checkmate",
	changelog: "https://github.com/bluewave-labs/checkmate/releases",
};

const getMenu = (t) => [
	{ name: t("menu.uptime"), path: "uptime", icon: <Icon name="Globe" /> },
	{ name: t("menu.pagespeed"), path: "pagespeed", icon: <Icon name="Gauge" /> },
	{ name: t("menu.infrastructure"), path: "infrastructure", icon: <Icon name="Link" /> },
	{
		name: t("menu.notifications"),
		path: "notifications",
		icon: <Icon name="Bell" />,
	},
	{ name: t("menu.checks"), path: "checks", icon: <Icon name="FileText" /> },
	{ name: t("menu.incidents"), path: "incidents", icon: <Icon name="AlertTriangle" /> },
	{ name: t("menu.statusPages"), path: "status", icon: <Icon name="Wifi" /> },
	{ name: t("menu.maintenance"), path: "maintenance", icon: <Icon name="Wrench" /> },
	{ name: t("menu.logs"), path: "logs", icon: <Icon name="Database" /> },
	{
		name: t("menu.settings"),
		icon: <Icon name="Settings" />,
		path: "settings",
	},
];

const getOtherMenuItems = (t) => [
	{ name: t("menu.support"), path: "support", icon: <Icon name="HelpCircle" /> },
	{
		name: t("menu.discussions"),
		path: "discussions",
		icon: <Icon name="MessageCircle" />,
	},
	{ name: t("menu.docs"), path: "docs", icon: <Icon name="FileText" /> },
	{ name: t("menu.changelog"), path: "changelog", icon: <Icon name="Code" /> },
];

const getAccountMenuItems = (t) => [
	{ name: t("menu.profile"), path: "account/profile", icon: <Icon name="User" /> },
	{ name: t("menu.password"), path: "account/password", icon: <Icon name="Lock" /> },
	{ name: t("menu.team"), path: "account/team", icon: <Icon name="Users" /> },
];

const Sidebar = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { collapsed, width, transition } = useSidebar();

	const menu = getMenu(t);
	const otherMenuItems = getOtherMenuItems(t);
	const accountMenuItems = getAccountMenuItems(t);

	return (
		<Stack
			height="100vh"
			width={width}
			component="aside"
			position="fixed"
			top={0}
			left={0}
			paddingTop={theme.spacing(6)}
			paddingBottom={theme.spacing(6)}
			gap={theme.spacing(6)}
			sx={{
				transition,
				backgroundColor: "#000000",
				borderRight: "1px solid #344054",
				zIndex: 1000,
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
