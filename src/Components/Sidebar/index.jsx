import React, { useEffect, useState, useRef } from "react";
import {
	Box,
	Collapse,
	Divider,
	IconButton,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import ThemeSwitch from "../ThemeSwitch";
import Avatar from "../Avatar";
import StarPrompt from "../StarPrompt";
import LockSvg from "../../assets/icons/lock.svg?react";
import UserSvg from "../../assets/icons/user.svg?react";
import TeamSvg from "../../assets/icons/user-two.svg?react";
import LogoutSvg from "../../assets/icons/logout.svg?react";
import Support from "../../assets/icons/support.svg?react";
import Account from "../../assets/icons/user-edit.svg?react";
import Maintenance from "../../assets/icons/maintenance.svg?react";
import Monitors from "../../assets/icons/monitors.svg?react";
import Incidents from "../../assets/icons/incidents.svg?react";
import Integrations from "../../assets/icons/integrations.svg?react";
import PageSpeed from "../../assets/icons/page-speed.svg?react";
import Settings from "../../assets/icons/settings.svg?react";
import ArrowDown from "../../assets/icons/down-arrow.svg?react";
import ArrowUp from "../../assets/icons/up-arrow.svg?react";
import ArrowRight from "../../assets/icons/right-arrow.svg?react";
import ArrowLeft from "../../assets/icons/left-arrow.svg?react";
import DotsVertical from "../../assets/icons/dots-vertical.svg?react";
import ChangeLog from "../../assets/icons/changeLog.svg?react";
import Docs from "../../assets/icons/docs.svg?react";
import Folder from "../../assets/icons/folder.svg?react";
import StatusPages from "../../assets/icons/status-pages.svg?react";
import Discussions from "../../assets/icons/discussions.svg?react";
import DistributedUptimeIcon from "../../assets/icons/distributed-uptime.svg?react";
import "./index.css";

// Utils
import { useLocation, useNavigate } from "react-router";
import { useTheme } from "@emotion/react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthState } from "../../Features/Auth/authSlice";
import { toggleSidebar } from "../../Features/UI/uiSlice";
import { clearUptimeMonitorState } from "../../Features/UptimeMonitors/uptimeMonitorsSlice";

const menu = [
	{ name: "Uptime", path: "uptime", icon: <Monitors /> },
	{ name: "Pagespeed", path: "pagespeed", icon: <PageSpeed /> },
	{ name: "Infrastructure", path: "infrastructure", icon: <Integrations /> },
	{
		name: "Distributed uptime",
		path: "distributed-uptime",
		icon: <DistributedUptimeIcon />,
	},
	{ name: "Incidents", path: "incidents", icon: <Incidents /> },

	{ name: "Status pages", path: "status", icon: <StatusPages /> },
	{ name: "Maintenance", path: "maintenance", icon: <Maintenance /> },
	// { name: "Integrations", path: "integrations", icon: <Integrations /> },
	{
		name: "Settings",
		icon: <Settings />,
		path: "settings",
	},
];

const otherMenuItems = [
	{ name: "Support", path: "support", icon: <Support /> },
	{
		name: "Discussions",
		path: "discussions",
		icon: <Discussions />,
	},
	{ name: "Docs", path: "docs", icon: <Docs /> },
	{ name: "Changelog", path: "changelog", icon: <ChangeLog /> },
];

const accountMenuItems = [
	{ name: "Profile", path: "account/profile", icon: <UserSvg /> },
	{ name: "Password", path: "account/password", icon: <LockSvg /> },
	{ name: "Team", path: "account/team", icon: <TeamSvg /> },
];

/* TODO this could be a key in nested Path would be the link */
const URL_MAP = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	discussions: "https://github.com/bluewave-labs/checkmate/discussions",
	docs: "https://bluewavelabs.gitbook.io/checkmate",
	changelog: "https://github.com/bluewave-labs/bluewave-uptime/releases",
};

const PATH_MAP = {
	monitors: "Dashboard",
	pagespeed: "Dashboard",
	infrastructure: "Dashboard",
	["distributed-uptime"]: "Dashboard",
	account: "Account",
	settings: "Settings",
};

/**
 * @component
 * Sidebar component serves as a sidebar containing a menu.
 *
 * @returns {JSX.Element} The JSX element representing the Sidebar component.
 */

function Sidebar() {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const authState = useSelector((state) => state.auth);
	const collapsed = useSelector((state) => state.ui.sidebar.collapsed);
	const [open, setOpen] = useState({ Dashboard: false, Account: false, Other: false });
	const [anchorEl, setAnchorEl] = useState(null);
	const [popup, setPopup] = useState();
	const { user } = useSelector((state) => state.auth);
	const distributedUptimeEnabled = useSelector(
		(state) => state.ui.distributedUptimeEnabled
	);
	const sidebarRef = useRef(null);
	const [sidebarReady, setSidebarReady] = useState(false);
	const TRANSITION_DURATION = 200;

	useEffect(() => {
		if (!collapsed) {
			setSidebarReady(false);
			const timeout = setTimeout(() => {
				setSidebarReady(true);
			}, TRANSITION_DURATION);
			return () => clearTimeout(timeout);
		} else {
			setSidebarReady(false);
		}
	}, [collapsed]);	

	const renderAccountMenuItems = () => {
		let filteredAccountMenuItems = [...accountMenuItems];

		// If the user is in demo mode, remove the "Password" option
		if (user.role?.includes("demo")) {
			filteredAccountMenuItems = filteredAccountMenuItems.filter(
				(item) => item.name !== "Password"
			);
		}

		// If the user is NOT a superadmin, remove the "Team" option
		if (user.role && !user.role.includes("superadmin")) {
			filteredAccountMenuItems = filteredAccountMenuItems.filter(
				(item) => item.name !== "Team"
			);
		}

		return filteredAccountMenuItems.map((item) => (
			<MenuItem
				key={item.name}
				onClick={() => navigate(item.path)}
				sx={{
					gap: theme.spacing(2),
					borderRadius: theme.shape.borderRadius,
					pl: theme.spacing(4),
				}}
			>
				{item.icon}
				{item.name}
			</MenuItem>
		));
	};

	const openPopup = (event, id) => {
		setAnchorEl(event.currentTarget);
		setPopup(id);
	};
	const closePopup = () => {
		setAnchorEl(null);
	};

	/**
	 * Handles logging out the user
	 *
	 */
	const logout = async () => {
		// Clear auth state
		dispatch(clearAuthState());
		dispatch(clearUptimeMonitorState());
		navigate("/login");
	};

	useEffect(() => {
		const matchedKey = Object.keys(PATH_MAP).find((key) =>
			location.pathname.includes(key)
		);

		if (matchedKey) {
			setOpen((prev) => ({ ...prev, [PATH_MAP[matchedKey]]: true }));
		}
	}, [location]);

	const iconColor = theme.palette.primary.contrastTextTertiary;
	const sidebarClassName = `${collapsed ? "collapsed" : "expanded"} ${sidebarReady ? "sidebar-ready" : ""}`;

	/* TODO refactor this, there are a some ternaries and comments in the return  */
	return (
		<Stack
			component="aside"
			ref={sidebarRef}
			className={sidebarClassName}
			/* TODO general padding should be here */
			py={theme.spacing(6)}
			gap={theme.spacing(6)}
			/* TODO set all style in this sx if possible (when general)
			This is the top lever for styles
			*/
			sx={{
				position: "relative",
				borderRight: `1px solid ${theme.palette.primary.lowContrast}`, 
				borderColor: theme.palette.primary.lowContrast,
				borderRadius: 0,
				backgroundColor: theme.palette.primary.main,
				"& :is(p, span, .MuiListSubheader-root)": {
					/* 
					Text color for unselected menu items and menu headings
					Secondary contrast text against main background
					*/
					color: theme.palette.primary.contrastTextSecondary,
				},
				"& .MuiList-root svg path": {
					/* Menu Icons */
					stroke: iconColor,
				},
				"& .selected-path": {
					/* Selected menu item */
					backgroundColor: theme.palette.secondary.main,
					"&:hover": {
						backgroundColor: theme.palette.secondary.main,
					},
					"& .MuiListItemIcon-root svg path": {
						/* Selected menu item icon */
						stroke: theme.palette.secondary.contrastText,
					},
					"& .MuiListItemText-root :is(p, span)": {
						/* Selected menu item text */
						color: theme.palette.secondary.contrastText,
					},
				},
				"& .MuiListItemButton-root:not(.selected-path)": {
					transition: "background-color .3s",
					" &:hover": {
						/* Hovered menu item bg color */
						backgroundColor: theme.palette.tertiary.main,
						"& :is(p, span)": {
							/* Hovered menu item text color */
							color: theme.palette.tertiary.contrastText,
						},
					},
				},
			}}
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
							/* TODO this should be set at the top level if possible */
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
			{/* TODO Alignment done using padding. Use single source of truth to that*/}
			<Stack
				pt={theme.spacing(6)}
				pb={theme.spacing(12)}
				pl={theme.spacing(8)}
			>
				{/* TODO Abstract logo into component */}
				{/* TODO Turn logo into a link */}
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(4)}
					onClick={() => navigate("/")}
					sx={{ cursor: "pointer" }}
				>
					<Stack
						justifyContent="center"
						alignItems="center"
						minWidth={theme.spacing(16)}
						minHeight={theme.spacing(16)}
						pl="1px"
						fontSize={18}
						color={theme.palette.accent.contrastText}
						sx={{
							position: "relative",
							backgroundColor: theme.palette.accent.main,
							color: theme.palette.accent.contrastText,
							borderRadius: theme.shape.borderRadius,
							userSelect: "none",
						}}
					>
						C
					</Stack>
					<Typography
						component="span"
						mt={theme.spacing(2)}
						sx={{ opacity: 0.8, fontWeight: 500 }}
					>
						Checkmate
					</Typography>
				</Stack>
			</Stack>
			<Box
				sx={{
					flexGrow: 1,
					overflow: "auto",
					overflowX: "hidden",
					"&::-webkit-scrollbar": {
						width: theme.spacing(2),
					},
					"&::-webkit-scrollbar-thumb": {
						backgroundColor: theme.palette.primary.lowContrast,
						borderRadius: theme.spacing(4),
					},
				}}
			>
				<List
					component="nav"
					aria-labelledby="nested-menu-subheader"
					disablePadding
					sx={{
						px: theme.spacing(6),
						height: "100%",
						/* overflow: "hidden", */
					}}
				>
					{menu.map((item) => {
						if (
							item.path === "distributed-uptime" &&
							distributedUptimeEnabled === false
						) {
							return null;
						}
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
									<ListItemText>{item.name}</ListItemText>
								</ListItemButton>
							</Tooltip>
						) : collapsed ? (
							/* TODO Do we ever get here? If item does not have a path and collapsed state is true  */
							<React.Fragment key={item.name}>
								<Tooltip
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
											Boolean(anchorEl) && popup === item.name ? "selected-path" : ""
										}
										onClick={(event) => openPopup(event, item.name)}
										sx={{
											position: "relative",
											gap: theme.spacing(4),
											borderRadius: theme.shape.borderRadius,
											px: theme.spacing(4),
										}}
									>
										<ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
										<ListItemText>{item.name}</ListItemText>
									</ListItemButton>
								</Tooltip>
								<Menu
									className="sidebar-popup"
									anchorEl={anchorEl}
									open={Boolean(anchorEl) && popup === item.name}
									onClose={closePopup}
									disableScrollLock
									anchorOrigin={{
										vertical: "top",
										horizontal: "right",
									}}
									slotProps={{
										paper: {
											sx: {
												mt: theme.spacing(-2),
												ml: theme.spacing(1),
											},
										},
									}}
									MenuListProps={{ sx: { px: 1, py: 2 } }}
									sx={{
										ml: theme.spacing(8),
										/* TODO what is this selection? */
										"& .selected-path": {
											backgroundColor: theme.palette.tertiary.main,
										},
									}}
								>
									{item.nested.map((child) => {
										if (
											child.name === "Team" &&
											authState.user?.role &&
											!authState.user.role.includes("superadmin")
										) {
											return null;
										}

										return (
											<MenuItem
												className={
													location.pathname.includes(child.path) ? "selected-path" : ""
												}
												key={child.path}
												onClick={() => {
													const url = URL_MAP[child.path];
													if (url) {
														window.open(url, "_blank", "noreferrer");
													} else {
														navigate(`/${child.path}`);
													}
													closePopup();
												}}
												sx={{
													gap: theme.spacing(4),
													opacity: 0.9,
													/* TODO this has no effect? */
													"& svg": {
														"& path": {
															stroke: theme.palette.primary.contrastTextTertiary,
															strokeWidth: 1.1,
														},
													},
												}}
											>
												{child.icon}
												{child.name}
											</MenuItem>
										);
									})}
								</Menu>
							</React.Fragment>
						) : (
							/* TODO Do we ever get here? If item does not have a path and collapsed state is false */
							<React.Fragment key={item.name}>
								<ListItemButton
									onClick={() =>
										setOpen((prev) => ({
											...Object.fromEntries(Object.keys(prev).map((key) => [key, false])),
											[item.name]: !prev[item.name],
										}))
									}
									sx={{
										gap: theme.spacing(4),
										borderRadius: theme.shape.borderRadius,
										px: theme.spacing(4),
									}}
								>
									<ListItemIcon sx={{ minWidth: 0 }}>{item.icon}</ListItemIcon>
									<ListItemText>{item.name}</ListItemText>
									{open[`${item.name}`] ? <ArrowUp /> : <ArrowDown />}
								</ListItemButton>
								<Collapse
									in={open[`${item.name}`]}
									timeout="auto"
								>
									<List
										component="div"
										disablePadding
										sx={{ pl: theme.spacing(12) }}
									>
										{item.nested.map((child) => {
											if (
												child.name === "Team" &&
												authState.user?.role &&
												!authState.user.role.includes("superadmin")
											) {
												return null;
											}

											return (
												<ListItemButton
													className={
														location.pathname.includes(child.path) ? "selected-path" : ""
													}
													key={child.path}
													onClick={() => {
														const url = URL_MAP[child.path];
														if (url) {
															window.open(url, "_blank", "noreferrer");
														} else {
															navigate(`/${child.path}`);
														}
													}}
													sx={{
														gap: theme.spacing(4),
														borderRadius: theme.shape.borderRadius,
														pl: theme.spacing(4),
														"&::before": {
															content: `""`,
															position: "absolute",
															top: 0,
															left: "-7px",
															height: "100%",
															borderLeft: 1,
															borderLeftColor: theme.palette.primary.lowContrast,
														},
														"&:last-child::before": {
															height: "50%",
														},
														"&::after": {
															content: `""`,
															position: "absolute",
															top: "45%",
															left: "-8px",
															height: "3px",
															width: "3px",
															borderRadius: "50%",
															backgroundColor: theme.palette.primary.lowContrast,
														},
														"&.selected-path::after": {
															/* TODO what is this selector doing? */
															backgroundColor: theme.palette.primary.contrastTextTertiary,
															transform: "scale(1.2)",
														},
													}}
												>
													<ListItemIcon sx={{ minWidth: 0 }}>{child.icon}</ListItemIcon>
													<ListItemText>{child.name}</ListItemText>
												</ListItemButton>
											);
										})}
									</List>
								</Collapse>
							</React.Fragment>
						);
					})}
				</List>
			</Box>

			{!collapsed && <StarPrompt />}

			<List
				component="nav"
				disablePadding
				sx={{ px: theme.spacing(6) }}
			>
				{otherMenuItems.map((item) => {
					return item.path ? (
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
								onClick={() => {
									const url = URL_MAP[item.path];
									if (url) {
										window.open(url, "_blank", "noreferrer");
									} else {
										navigate(`/${item.path}`);
									}
								}}
								sx={{
									height: "37px",
									gap: theme.spacing(4),
									borderRadius: theme.shape.borderRadius,
									px: theme.spacing(4),
									pl: theme.spacing(5),
								}}
							>
								<ListItemIcon sx={{ minWidth: 0 }}>{item.icon} </ListItemIcon>
								<ListItemText>{item.name} </ListItemText>{" "}
							</ListItemButton>
						</Tooltip>
					) : null;
				})}
			</List>
			<Divider sx={{ mt: "auto", borderColor: theme.palette.primary.lowContrast }} />
			<Stack
				direction="row"
				height="50px"
				alignItems="center"
				py={theme.spacing(4)}
				px={theme.spacing(8)}
				gap={theme.spacing(2)}
				borderRadius={theme.shape.borderRadius}
			>
				{collapsed ? (
					<>
						<Tooltip
							title="Options"
							slotProps={{
								popper: {
									modifiers: [
										{
											name: "offset",
											options: {
												offset: [0, -10],
											},
										},
									],
								},
							}}
							disableInteractive
						>
							<IconButton
								onClick={(event) => openPopup(event, "logout")}
								sx={{ p: 0, "&:focus": { outline: "none" } }}
							>
								<Avatar small={true} />
							</IconButton>
						</Tooltip>
					</>
				) : (
					<>
						<Avatar small={true} />
						<Box
							ml={theme.spacing(2)}
							sx={{ maxWidth: "50%", overflow: "hidden" }}
						>
							<Typography
								component="span"
								fontWeight={500}
								sx={{
									display: "block",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{authState.user?.firstName} {authState.user?.lastName}
							</Typography>
							<Typography sx={{ textTransform: "capitalize" }}>
								{authState.user?.role}
							</Typography>
						</Box>
						<Stack
							className="sidebar-delay-fade"
							flexDirection={"row"}
							marginLeft={"auto"}
							columnGap={theme.spacing(2)}
						>
							<ThemeSwitch color={iconColor} />
							<Tooltip
								title="Controls"
								disableInteractive
							>
								<IconButton
									sx={{
										ml: "auto",
										mr: "-8px",
										"&:focus": { outline: "none" },
										alignSelf: "center",
										padding: "10px",

										"& svg": {
											width: "22px",
											height: "22px",
										},
										"& svg path": {
											/* Vertical three dots */
											stroke: iconColor,
										},
									}}
									onClick={(event) => openPopup(event, "logout")}
								>
									<DotsVertical />
								</IconButton>
							</Tooltip>
						</Stack>
					</>
				)}
				<Menu
					className="sidebar-popup"
					anchorEl={anchorEl}
					open={Boolean(anchorEl) && popup === "logout"}
					onClose={closePopup}
					disableScrollLock
					anchorOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					slotProps={{
						paper: {
							sx: {
								marginTop: theme.spacing(-4),
								marginLeft: collapsed ? theme.spacing(2) : 0,
							},
						},
					}}
					MenuListProps={{
						sx: {
							p: 2,
							"& li": { m: 0 },
							"& li:has(.MuiBox-root):hover": {
								backgroundColor: "transparent",
							},
						},
					}}
					sx={{
						ml: theme.spacing(4),
					}}
				>
					{collapsed && (
						<MenuItem sx={{ cursor: "default", minWidth: "50%" }}>
							<Box
								mb={theme.spacing(2)}
								sx={{
									minWidth: "50%",
									maxWidth: "max-content",
									overflow: "visible",
									whiteSpace: "nowrap",
								}}
							>
								<Typography
									component="span"
									fontWeight={500}
									fontSize={13}
									sx={{
										display: "block",
										whiteSpace: "nowrap",
										overflow: "visible",
										// wordBreak: "break-word",
										textOverflow: "clip",
									}}
								>
									{authState.user?.firstName} {authState.user?.lastName}
								</Typography>
								<Typography
									sx={{
										textTransform: "capitalize",
										fontSize: 12,
										whiteSpace: "nowrap",
										overflow: "visible",
										// wordBreak: "break-word",
									}}
								>
									{authState.user?.role}
								</Typography>
							</Box>
						</MenuItem>
					)}
					{/* TODO Do we need two dividers? */}
					{collapsed && <Divider />}
					{/* <Divider /> */}
					{renderAccountMenuItems()}
					<MenuItem
						onClick={logout}
						sx={{
							gap: theme.spacing(4),
							borderRadius: theme.shape.borderRadius,
							pl: theme.spacing(4),
							"& svg path": {
								stroke: iconColor,
							},
						}}
					>
						<LogoutSvg />
						Log out
					</MenuItem>
				</Menu>
			</Stack>
		</Stack>
	);
}

export default Sidebar;
