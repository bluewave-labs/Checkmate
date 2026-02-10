import { useEffect } from "react";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import { useSidebar } from "@/Hooks/useSidebar.js";
import { Logo } from "@/Components/v2/sidebar/Logo";
import { getMenu } from "@/Components/v2/sidebar/Menu";
import { NavItem } from "@/Components/v2/sidebar/NavItem";

import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme, useMediaQuery } from "@mui/material";
import { useDispatch } from "react-redux";
import { setCollapsed } from "@/Features/UI/uiSlice";

export const Sidebar = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const { width, transition } = useSidebar();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const menu = getMenu(t);

	useEffect(() => {
		dispatch(setCollapsed({ collapsed: isSmall }));
	}, [isSmall, dispatch]);

	return (
		<Stack
			component="aside"
			position={isSmall ? "fixed" : "sticky"}
			top={0}
			left={0}
			minHeight={"100vh"}
			maxHeight={"100vh"}
			paddingTop={theme.spacing(6)}
			paddingBottom={theme.spacing(6)}
			gap={theme.spacing(6)}
			borderRight={`1px solid ${theme.palette.divider}`}
			width={width}
			sx={{
				transition: transition,
				zIndex: isSmall ? (t) => t.zIndex.drawer : "auto",
			}}
		>
			<List
				component="nav"
				disablePadding
				sx={{
					px: theme.spacing(6),
					height: "100%",
				}}
			>
				<Logo
					pt={theme.spacing(8)}
					pb={theme.spacing(10)}
				/>
				{menu.map((item) => {
					const selected = location.pathname.startsWith(`/${item.path}`);
					return (
						<NavItem
							key={item.path}
							item={item}
							selected={selected}
							onClick={() => {
								navigate(`/${item.path}`);
								if (isSmall) {
									dispatch(setCollapsed({ collapsed: true }));
								}
							}}
						/>
					);
				})}
			</List>
		</Stack>
	);
};
