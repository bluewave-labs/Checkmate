import { useEffect } from "react";
import Backdrop from "@mui/material/Backdrop";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import { LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useSidebar } from "@/Hooks/useSidebar.js";
import { Logo } from "@/Components/sidebar/Logo";
import { getMenu, getAccountMenu } from "@/Components/sidebar/Menu";
import { NavItem } from "@/Components/sidebar/NavItem";
import { StarPrompt } from "@/Components/sidebar/StarPrompt";
import { AuthFooter } from "@/Components/sidebar/Authfooter";

import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme, useMediaQuery } from "@mui/material";
import { useDispatch } from "react-redux";
import { setCollapsed } from "@/Features/UI/uiSlice";

const URL_MAP: Record<string, string> = {
	support: "https://discord.com/invite/NAb6H3UTjK",
	discussions: "https://github.com/bluewave-labs/checkmate/discussions",
	docs: "https://checkmate.so/docs",
	changelog: "https://github.com/bluewave-labs/checkmate/releases",
};

export const Sidebar = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const { width, transition, transitionTiming, collapsed } = useSidebar();
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const menu = getMenu(t);
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
		<>
			<Backdrop
				open={!collapsed && isSmall}
				onClick={() => dispatch(setCollapsed({ collapsed: true }))}
				sx={{ zIndex: 999 }}
			/>
			<Stack
				component="aside"
				position={isSmall ? "fixed" : "sticky"}
				top={0}
				left={0}
				minHeight={"100vh"}
				maxHeight={"100vh"}
				paddingTop={theme.spacing(LAYOUT.SM)}
				paddingBottom={theme.spacing(LAYOUT.SM)}
				gap={theme.spacing(LAYOUT.SM)}
				borderRight={`1px solid ${theme.palette.divider}`}
				width={width}
				// On `paper` rather than inheriting the page ground, so the nav
				// reads as a surface and the content area stays the darker
				// `default`. Opaque, so the blur it used to carry is gone.
				bgcolor={theme.palette.background.paper}
				sx={{
					touchAction: "none",
					transition: transition,
					zIndex: 1000,
				}}
			>
				<List
					component="nav"
					disablePadding
					sx={{
						px: theme.spacing(LAYOUT.SM),
						flex: 1,
					}}
				>
					<Logo
						pt={theme.spacing(LAYOUT.MD)}
						pb={theme.spacing(LAYOUT.MD)}
					/>
					{menu.map((group) => (
						<Box key={group.group}>
							<Box
								position="relative"
								overflow="hidden"
							>
								<Typography
									variant="eyebrow"
									component="div"
									color={theme.palette.text.disabled}
									fontSize={typographyLevels.s}
									paddingLeft={theme.spacing(5)}
									paddingTop={theme.spacing(LAYOUT.SM)}
									paddingBottom={theme.spacing(LAYOUT.XXS)}
									whiteSpace="nowrap"
									sx={{
										opacity: collapsed ? 0 : 1,
										transition: `opacity ${transitionTiming}`,
									}}
								>
									{group.group}
								</Typography>
								<Divider
									sx={{
										position: "absolute",
										top: "50%",
										left: 0,
										right: 0,
										opacity: collapsed ? 1 : 0,
										transition: `opacity ${transitionTiming}`,
									}}
								/>
							</Box>
							{group.items.map((item) => {
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
						</Box>
					))}
				</List>
				<StarPrompt />

				<Divider sx={{ borderColor: theme.palette.divider }} />

				<AuthFooter
					collapsed={collapsed}
					accountMenuItems={accountMenu}
				/>
			</Stack>
		</>
	);
};
