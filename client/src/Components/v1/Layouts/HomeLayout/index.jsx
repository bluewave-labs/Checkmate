import Sidebar from "../../Sidebar/index.jsx";
import { Outlet } from "react-router";
import { Box, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import "./index.css";

const HomeLayout = () => {
	const collapsed = useSelector((state) => state.ui.sidebar?.collapsed ?? false);

	return (
		<Stack
			className="home-layout"
			flexDirection="row"
		>
			<Sidebar />
			{/* Spacer for fixed sidebar */}
			<Box
				sx={{
					width: collapsed
						? "var(--env-var-side-bar-collapsed-width)"
						: "var(--env-var-side-bar-width)",
					flexShrink: 0,
					transition: "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)",
				}}
			/>
			<Stack className="home-content-wrapper">
				<Outlet />
			</Stack>
		</Stack>
	);
};

export default HomeLayout;
