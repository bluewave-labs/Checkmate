import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCollapsed } from "@/Features/UI/uiSlice";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

import { CollapseButton } from "@/Components/v2/Layouts/Sidebar/CollapseButton";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import { Logo } from "@/Components/v2/Layouts/Sidebar/Logo";
import { getMenu, getBottomMenu } from "@/Components/v2/Layouts/Sidebar/Menu";
import { NavItem } from "@/Components/v2/Layouts/Sidebar/NavItem";
import { BottomControls } from "@/Components/v2/Layouts/Sidebar/BottomControls";

export const COLLAPSED_WIDTH = 64;
export const EXPANDED_WIDTH = 250;

export const SideBar = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const dispatch = useDispatch();
	const collapsed = useSelector((state: any) => state.ui.sidebar.collapsed);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const menu = getMenu(t);
	const bottomMenu = getBottomMenu(t);

	useEffect(() => {
		dispatch(setCollapsed({ collapsed: isSmall }));
	}, [isSmall]);

	return (
		<Stack
			component="aside"
			position="sticky"
			top={0}
			minHeight={"100vh"}
			maxHeight={"100vh"}
			paddingTop={theme.spacing(6)}
			paddingBottom={theme.spacing(6)}
			gap={theme.spacing(6)}
			borderRight={`1px solid ${theme.palette.primary.lowContrast}`}
			width={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
			sx={{
				transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
			}}
		>
			<CollapseButton collapsed={collapsed} />
			<Logo collapsed={collapsed} />
			<List
				component="nav"
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
			<List
				component="nav"
				disablePadding
				sx={{
					px: theme.spacing(6),
				}}
			>
				{bottomMenu.map((item) => {
					const selected = location.pathname.startsWith(`/${item.path}`);

					return (
						<NavItem
							key={item.path}
							item={item}
							collapsed={collapsed}
							selected={selected}
							onClick={() => {
								if (item.url) {
									window.open(item.url, "_blank", "noreferrer");
								} else {
									navigate(`/${item.path}`);
								}
							}}
						/>
					);
				})}
			</List>
			<Divider sx={{ mt: "auto", borderColor: theme.palette.primary.lowContrast }} />
			<BottomControls />
		</Stack>
	);
};
