import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ArrowRight from "../../assets/icons/right-arrow.svg?react";
import ArrowLeft from "../../assets/icons/left-arrow.svg?react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Logo from "./logo";

import ThemeSwitch from "../ThemeSwitch";
import Avatar from "../Avatar";
import StarPrompt from "../StarPrompt";
import LockSvg from "../../assets/icons/lock.svg?react";
import UserSvg from "../../assets/icons/user.svg?react";
import TeamSvg from "../../assets/icons/user-two.svg?react";
import LogoutSvg from "../../assets/icons/logout.svg?react";
import Support from "../../assets/icons/support.svg?react";
import Maintenance from "../../assets/icons/maintenance.svg?react";
import Monitors from "../../assets/icons/monitors.svg?react";
import Incidents from "../../assets/icons/incidents.svg?react";
import Integrations from "../../assets/icons/integrations.svg?react";
import PageSpeed from "../../assets/icons/page-speed.svg?react";
import Settings from "../../assets/icons/settings.svg?react";
import ArrowDown from "../../assets/icons/down-arrow.svg?react";
import ArrowUp from "../../assets/icons/up-arrow.svg?react";
import DotsVertical from "../../assets/icons/dots-vertical.svg?react";
import ChangeLog from "../../assets/icons/changeLog.svg?react";
import Docs from "../../assets/icons/docs.svg?react";
import StatusPages from "../../assets/icons/status-pages.svg?react";
import Discussions from "../../assets/icons/discussions.svg?react";
import Notifications from "../../assets/icons/notifications.svg?react";
import Logs from "../../assets/icons/logs.svg?react";

// Utils
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "../../Features/UI/uiSlice";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

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

const Sidebar = () => {
	const theme = useTheme();
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const navigate = useNavigate();
	// Redux state
	const collapsed = useSelector((state) => state.ui.sidebar.collapsed);

	// Local state
	const [open, setOpen] = useState({ Dashboard: false, Account: false, Other: false });

	const menu = getMenu(t);
	console.log(collapsed);
	return (
		<Stack
			width={collapsed ? "64px" : "var(--env-var-side-bar-width)"}
			component="aside"
			position="relative"
			borderRight={`1px solid ${theme.palette.primary.lowContrast}`}
		>
			<IconButton
				sx={{
					position: "absolute",
					/* TODO 60 is a magic number. if logo chnges size this might break */
					top: 60,
					right: 0,
					transform: `translate(50%, 0)`,
					backgroundColor: theme.palette.tertiary.main,
					border: 1,
					borderColor: theme.palette.primary.lowContrast,
					p: theme.spacing(2.5),
					"& svg": {
						width: theme.spacing(8),
						height: theme.spacing(8),
						"& path": {
							stroke: theme.palette.primary.contrastTextSecondary,
						},
					},
					"&:focus": { outline: "none" },
					"&:hover": {
						backgroundColor: theme.palette.primary.lowContrast,
						borderColor: theme.palette.primary.lowContrast,
					},
				}}
				onClick={() => {
					setOpen((prev) =>
						Object.fromEntries(Object.keys(prev).map((key) => [key, false]))
					);
					dispatch(toggleSidebar());
				}}
			>
				{collapsed ? <ArrowRight /> : <ArrowLeft />}
			</IconButton>
			<Logo />
			<List
				component="nav"
				aria-labelledby="nested-menu-subheader"
				disablePadding
				sx={{
					mt: theme.spacing(12),
					px: theme.spacing(6),
					height: "100%",
					/* overflow: "hidden", */
				}}
			>
				{menu.map((item) => {
					return item.path ? (
						/* If item has a path */
						<Tooltip
							key={item.path}
							placement="right"
							title={collapsed ? item.name : ""}
							slotProps={{
								popper: {
									modifiers: [
										{
											name: "offset",
											options: {
												offset: [0, -16],
											},
										},
									],
								},
							}}
							disableInteractive
						>
							<ListItemButton
								className={
									location.pathname.startsWith(`/${item.path}`) ? "selected-path" : ""
								}
								onClick={() => navigate(`/${item.path}`)}
								sx={{
									height: "37px",
									gap: theme.spacing(4),
									borderRadius: theme.shape.borderRadius,
									px: theme.spacing(4),
									pl: theme.spacing(5),
								}}
							>
								<ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
								{!collapsed && <ListItemText>{item.name}</ListItemText>}
							</ListItemButton>
						</Tooltip>
					) : null;
				})}
			</List>
		</Stack>
	);
};

export default Sidebar;
