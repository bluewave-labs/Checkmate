import { useState, useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@emotion/react";

import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

const COLLAPSED_WIDTH = 50;
const EXPANDED_WIDTH = 250;

const SideBar = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));

	const [collapsed, setCollapsed] = useState(false);
	useEffect(() => {
		setCollapsed(isSmall);
	}, [isSmall]);
	return (
		<Stack
			border="1px solid red"
			width={collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}
			sx={{
				transition: "width 0.3s ease",
			}}
		>
			<Box
				border="1px solid blue"
				onClick={() => setCollapsed(!collapsed)}
			>
				Sidebar Content
			</Box>
		</Stack>
	);
};

const RootLayout = ({ mode = "light" }) => {
	return (
		<Stack
			direction="row"
			minHeight="100vh"
		>
			<SideBar />
			<Outlet />
		</Stack>
	);
};

export default RootLayout;
