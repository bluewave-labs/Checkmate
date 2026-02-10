import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { Avatar, Icon } from "@/Components/v2/design-elements";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { MoreVertical, LogOut } from "lucide-react";

import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router";
import { clearAuthState } from "@/Features/Auth/authSlice.js";
import { useDispatch } from "react-redux";
import type { RootState } from "@/Types/state.js";

const getFilteredAccountMenuItems = (user: any, items: any[]) => {
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

const getRoleDisplayText = (user: any, t: Function) => {
	if (!user?.role) return "";

	if (user.role.includes("superadmin"))
		return t("components.sidebar.authFooter.roles.superAdmin");
	if (user.role.includes("admin")) return t("components.sidebar.authFooter.roles.admin");
	if (user.role.includes("user"))
		return t("components.sidebar.authFooter.roles.teamMember");
	if (user.role.includes("demo"))
		return t("components.sidebar.authFooter.roles.demoUser");

	return user.role;
};

export const AuthFooter = ({
	collapsed,
	accountMenuItems,
}: {
	collapsed: boolean;
	accountMenuItems: any[];
}) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const authState = useSelector((state: RootState) => state.auth);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const openPopup = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const closePopup = () => {
		setAnchorEl(null);
	};

	const logout = async () => {
		dispatch(clearAuthState());
		navigate("/login");
	};
	const renderAccountMenuItems = (user: any, items: any[]) => {
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
					"& svg": {
						stroke: theme.palette.text.secondary,
					},
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
			alignItems="center"
			py={theme.spacing(4)}
			px={theme.spacing(8)}
			gap={theme.spacing(2)}
			borderRadius={theme.shape.borderRadius}
			boxSizing={"border-box"}
		>
			<Avatar
				small={true}
				onClick={(e: any) => {
					openPopup(e);
				}}
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
						fontWeight={500}
						lineHeight={1}
						sx={{
							display: "block",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							color: theme.palette.text.primary,
						}}
					>
						{authState.user?.firstName} {authState.user?.lastName}
					</Typography>
					<Typography
						textOverflow="ellipsis"
						overflow="hidden"
						whiteSpace="nowrap"
						sx={{
							textTransform: "capitalize",
							color: theme.palette.text.secondary,
						}}
					>
						{getRoleDisplayText(authState.user, t)}
					</Typography>
				</Stack>
				<Tooltip
					title={t("components.sidebar.authFooter.navControls")}
					disableInteractive
				>
					<IconButton
						sx={{
							ml: "50px",
							"&:focus": { outline: "none" },
							alignSelf: "center",
							"& svg": {
								stroke: theme.palette.text.secondary,
							},
						}}
						onClick={(event) => openPopup(event)}
					>
						<Icon
							icon={MoreVertical}
							size={22}
						/>
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
								}}
							>
								{authState.user?.role}
							</Typography>
						</Box>
					</MenuItem>
				)}
				{renderAccountMenuItems(authState.user, accountMenuItems)}
				<MenuItem
					onClick={logout}
					sx={{
						gap: theme.spacing(2),
						borderRadius: theme.shape.borderRadius,
						pl: theme.spacing(4),
						"& svg": {
							stroke: theme.palette.text.secondary,
						},
					}}
				>
					<Icon
						icon={LogOut}
						size={20}
					/>
					{t("components.sidebar.authFooter.logOut")}
				</MenuItem>
			</Menu>
		</Stack>
	);
};
