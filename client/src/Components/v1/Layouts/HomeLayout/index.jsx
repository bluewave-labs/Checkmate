import Sidebar from "../../Sidebar/index.jsx";
import { Outlet } from "react-router";
import { Box, Stack } from "@mui/material";
import { useSidebar } from "@/Hooks/useSidebar.js";

import "./index.css";

const HomeLayout = () => {
	const { width, transition } = useSidebar();

	return (
		<Stack
			className="home-layout"
			flexDirection="row"
		>
			<Sidebar />
			<Box
				sx={{
					width,
					flexShrink: 0,
					transition,
				}}
			/>
			<Stack className="home-content-wrapper">
				<Outlet />
			</Stack>
		</Stack>
	);
};

export default HomeLayout;
