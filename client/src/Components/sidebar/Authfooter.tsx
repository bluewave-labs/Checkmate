import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material";
import { SPACING, LAYOUT } from "@/Utils/Theme/constants";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router";
import { MoreVertical, LogOut } from "lucide-react";
import { Avatar, Icon } from "@/Components/design-elements";
import { clearAuthState } from "@/Features/Auth/authSlice.js";
import type { RootState } from "@/Types/state.js";

interface AuthFooterProps {
	collapsed: boolean;
	accountMenuItems: Array<{
		name: string;
		path: string;
		icon: React.ReactNode;
	}>;
}

export const AuthFooter = ({ collapsed, accountMenuItems }: AuthFooterProps) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const user = useSelector((state: RootState) => state.auth.user);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	const menuOpen = Boolean(anchorEl);
	const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
		setAnchorEl(e.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	const handleNavigate = (path: string) => {
		handleMenuClose();
		navigate(path);
	};

	const handleLogout = () => {
		dispatch(clearAuthState());
		navigate("/login");
	};

	const getRoleText = () => {
		const role = user?.role ?? "";
		if (role.includes("superadmin"))
			return t("components.sidebar.authFooter.roles.superAdmin");
		if (role.includes("admin")) return t("components.sidebar.authFooter.roles.admin");
		if (role.includes("user")) return t("components.sidebar.authFooter.roles.user");
		if (role.includes("demo")) return t("components.sidebar.authFooter.roles.demoUser");
		return role;
	};

	const filteredMenuItems = accountMenuItems.filter((item) => {
		if (!user) return false;
		if (item.name === "Password" && user.role?.includes("demo")) return false;
		if (item.name === "Team" && !user.role?.includes("superadmin")) return false;
		return true;
	});

	const menuItemSx = {
		gap: theme.spacing(4),
		borderRadius: theme.shape.borderRadius,
		pl: theme.spacing(LAYOUT.XS),
		"& svg": {
			height: 16,
			width: 16,
			opacity: 0.81,
			stroke: theme.palette.text.secondary,
		},
	};

	return (
		<Stack
			direction="row"
			alignItems="center"
			py={theme.spacing(LAYOUT.XS)}
			px={theme.spacing(LAYOUT.MD)}
			gap={theme.spacing(LAYOUT.MD)}
		>
			<Avatar
				small
				onClick={collapsed ? handleMenuOpen : undefined}
				sx={{ cursor: collapsed ? "pointer" : "default" }}
			/>

			{!collapsed && (
				<Stack
					direction="row"
					alignItems="center"
					gap={theme.spacing(SPACING.MD)}
					minWidth={0}
					flex={1}
				>
					<Stack
						minWidth={0}
						flex={1}
					>
						<Typography
							fontWeight={500}
							noWrap
							sx={{ color: theme.palette.text.primary }}
						>
							{user?.firstName} {user?.lastName}
						</Typography>
						<Typography
							noWrap
							sx={{ textTransform: "capitalize", color: theme.palette.text.secondary }}
						>
							{getRoleText()}
						</Typography>
					</Stack>
					<IconButton
						onClick={handleMenuOpen}
						sx={{
							"&:focus": { outline: "none" },
							"& svg": { stroke: theme.palette.text.secondary },
						}}
					>
						<Icon
							icon={MoreVertical}
							size={22}
						/>
					</IconButton>
				</Stack>
			)}

			<Menu
				anchorEl={anchorEl}
				open={menuOpen}
				onClose={handleMenuClose}
				disableScrollLock
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{
					paper: {
						sx: {
							mt: theme.spacing(-LAYOUT.XS),
							ml: collapsed ? theme.spacing(SPACING.LG) : 0,
						},
					},
				}}
				MenuListProps={{ sx: { p: 2, "& li": { m: 0 } } }}
				sx={{ ml: theme.spacing(LAYOUT.XS) }}
			>
				{collapsed && (
					<Box
						px={2}
						pb={2}
						sx={{ pointerEvents: "none" }}
					>
						<Typography
							fontWeight={500}
							fontSize={13}
						>
							{user?.firstName} {user?.lastName}
						</Typography>
						<Typography
							fontSize={12}
							sx={{ textTransform: "capitalize" }}
						>
							{getRoleText()}
						</Typography>
					</Box>
				)}
				{filteredMenuItems.map((item) => (
					<MenuItem
						key={item.name}
						onClick={() => handleNavigate(item.path)}
						sx={menuItemSx}
					>
						{item.icon}
						{item.name}
					</MenuItem>
				))}
				<MenuItem
					onClick={handleLogout}
					sx={menuItemSx}
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
