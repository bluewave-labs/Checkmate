import { useEffect } from "react";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import { useSidebar } from "@/Hooks/useSidebar.js";
import { Logo } from "@/Components/v2/sidebar/Logo";
import { getMenu, getBottomMenu, getAccountMenu } from "@/Components/v2/sidebar/Menu";
import { NavItem } from "@/Components/v2/sidebar/NavItem";
import { StarPrompt } from "@/Components/v2/sidebar/StarPrompt";
import { AuthFooter } from "@/Components/v2/sidebar/Authfooter";

import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme, useMediaQuery } from "@mui/material";
import { useDispatch } from "react-redux";
import { setCollapsed } from "@/Features/UI/uiSlice";

const URL_MAP: Record<string, string> = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	discussions: "https://github.com/bluewave-labs/checkmate/discussions",
	docs: "https://bluewavelabs.gitbook.io/checkmate",
	changelog: "https://github.com/bluewave-labs/checkmate/releases",
};

export const Sidebar = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const { width, transition, collapsed } = useSidebar();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const menu = getMenu(t);
	const bottomMenu = getBottomMenu(t);
	const accountMenu = getAccountMenu(t);

	useEffect(() => {
		dispatch(setCollapsed({ collapsed: isSmall }));
	}, [isSmall, dispatch]);

	const handleNavClick = (path: string) => {
		const url = URL_MAP[path];
		if (url) {
			window.open(url, "_blank", "noreferrer");
		} else {
			navigate(`/${path}`);
		}
		if (isSmall) {
			dispatch(setCollapsed({ collapsed: true }));
		}
	};

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
					flex: 1,
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
							onClick={() => handleNavClick(item.path)}
						/>
					);
				})}
			</List>
			<StarPrompt />
			<List
				component="nav"
				disablePadding
				sx={{ px: theme.spacing(6) }}
			>
				{bottomMenu.map((item) => {
					const selected = location.pathname.startsWith(`/${item.path}`);
					return (
						<NavItem
							key={item.path}
							item={item}
							selected={selected}
							onClick={() => handleNavClick(item.path)}
						/>
					);
				})}
			</List>
			<Divider sx={{ borderColor: theme.palette.divider }} />

			<AuthFooter
				collapsed={collapsed}
				accountMenuItems={accountMenu}
			/>
		</Stack>
	);
};
