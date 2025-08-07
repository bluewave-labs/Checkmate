import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Avatar from "../../Avatar";
import ThemeSwitch from "../../ThemeSwitch";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import DotsVertical from "../../../assets/icons/dots-vertical.svg?react";
import LogoutSvg from "../../../assets/icons/logout.svg?react";

import { useTheme } from "@emotion/react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router";
import { clearAuthState } from "../../../Features/Auth/authSlice";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";

const getFilteredAccountMenuItems = (user, items) => {
	if (!user) return [];

	let filtered = [...items];

	if (user.role?.includes("demo")) {
		filtered = filtered.filter((item) => item.name !== "Password");
	}

	if (!user.role?.includes("superadmin")) {
		filtered = filtered.filter((item) => item.name !== "Team");
	}

	return filtered;
};

const getRoleDisplayText = (user, t) => {
	if (!user?.role) return "";

	if (user.role.includes("superadmin")) return t("roles.superAdmin");
	if (user.role.includes("admin")) return t("roles.admin");
	if (user.role.includes("user")) return t("roles.teamMember");
	if (user.role.includes("demo")) return t("roles.demoUser");

	return user.role;
};

const AuthFooter = ({ collapsed, accountMenuItems }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const authState = useSelector((state) => state.auth);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [anchorEl, setAnchorEl] = useState(null);

	const openPopup = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const closePopup = () => {
		setAnchorEl(null);
	};

	const logout = async () => {
		dispatch(clearAuthState());
		navigate("/login");
	};
	const renderAccountMenuItems = (user, items) => {
		const filteredItems = getFilteredAccountMenuItems(user, items);

		return filteredItems.map((item) => (
			<MenuItem
				key={item.name}
				onClick={() => {
					closePopup();
					navigate(item.path);
				}}
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
	return (
		<Stack
			direction="row"
			height="var(--env-var-side-bar-auth-footer-height)"
			alignItems="center"
			py={theme.spacing(4)}
			px={theme.spacing(8)}
			gap={theme.spacing(2)}
			borderRadius={theme.shape.borderRadius}
			boxSizing={"border-box"}
		>
			<Avatar
				small={true}
				onClick={(e) => collapsed && openPopup(e)}
				sx={{
					cursor: collapsed ? "pointer" : "default",
				}}
			/>

			<Stack
				direction={"row"}
				alignItems={"center"}
				gap={theme.spacing(2)}
				minWidth={0}
				maxWidth={collapsed ? 0 : "100%"}
				sx={{
					opacity: collapsed ? 0 : 1,
					transition: "opacity 300ms ease, max-width 300ms ease",
					transitionDelay: collapsed ? "0ms" : "300ms",
				}}
			>
				<Stack
					ml={theme.spacing(2)}
					sx={{
						maxWidth: "50%",
						overflow: "hidden",
					}}
				>
					<Typography
						color={theme.palette.primary.contrastText}
						fontWeight={500}
						lineHeight={1}
						fontSize={"var(--env-var-font-size-medium)"}
						sx={{
							display: "block",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{authState.user?.firstName} {authState.user?.lastName}
					</Typography>
					<Typography
						color={theme.palette.primary.contrastText}
						fontSize={"var(--env-var-font-size-small)"}
						textOverflow="ellipsis"
						overflow="hidden"
						whiteSpace="nowrap"
						sx={{ textTransform: "capitalize", opacity: 0.8 }}
					>
						{getRoleDisplayText(authState.user, t)}
					</Typography>
				</Stack>
				<Tooltip
					title={t("navControls")}
					disableInteractive
				>
					<IconButton
						sx={{
							ml: "50px",
							"&:focus": { outline: "none" },
							alignSelf: "center",

							"& svg": {
								width: "22px",
								height: "22px",
							},
							"& svg path": {
								/* Vertical three dots */
								stroke: theme.palette.primary.contrastTextTertiary,
							},
						}}
						onClick={(event) => openPopup(event)}
					>
						<DotsVertical />
					</IconButton>
				</Tooltip>
			</Stack>
			<Menu
				className="sidebar-popup"
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
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
				{renderAccountMenuItems(authState.user, accountMenuItems)}
				<MenuItem
					onClick={logout}
					sx={{
						gap: theme.spacing(4),
						borderRadius: theme.shape.borderRadius,
						pl: theme.spacing(4),
						"& svg path": {
							stroke: theme.palette.primary.contrastTextTertiary,
						},
					}}
				>
					<LogoutSvg />
					{t("menu.logOut", "Log out")}
				</MenuItem>
			</Menu>
		</Stack>
	);
};

AuthFooter.propTypes = {
	collapsed: PropTypes.bool,
	accountMenuItems: PropTypes.array,
};

export default AuthFooter;
