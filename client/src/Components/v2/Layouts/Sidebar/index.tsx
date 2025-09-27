import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCollapsed } from "@/Features/UI/uiSlice";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { CollapseButton } from "@/Components/v2/Layouts/Sidebar/CollapseButton";
import Stack from "@mui/material/Stack";
import { Logo } from "@/Components/v2/Layouts/Sidebar/Logo";

export const COLLAPSED_WIDTH = 64;
export const EXPANDED_WIDTH = 250;

export const SideBar = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const dispatch = useDispatch();
	const collapsed = useSelector((state: any) => state.ui.sidebar.collapsed);

	useEffect(() => {
		dispatch(setCollapsed({ collapsed: isSmall }));
	}, [isSmall]);

	return (
		<Stack
			position="sticky"
			paddingTop={theme.spacing(6)}
			paddingBottom={theme.spacing(6)}
			gap={theme.spacing(6)}
			borderRight={`1px solid ${theme.palette.primary.lowContrast}`}
			width={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
			sx={{
				transition: "width 0.3s ease",
			}}
		>
			<CollapseButton collapsed={collapsed} />
			<Logo collapsed={collapsed} />
		</Stack>
	);
};
