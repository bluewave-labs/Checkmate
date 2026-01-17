import Sidebar from "../../Sidebar/index.jsx";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";
import { UserGuideSidebar, useUserGuideSidebarContext } from "../../UserGuide";

import "./index.css";

const HomeLayout = () => {
	const { requiredPaddingRight } = useUserGuideSidebarContext();

	return (
		<Stack
			className="home-layout"
			flexDirection="row"
			gap={14}
			sx={{
				marginRight: `${requiredPaddingRight}px`,
				transition: "margin-right 300ms ease-in-out",
			}}
		>
			<Sidebar />
			<Stack className="home-content-wrapper">
				<Outlet />
			</Stack>
			<UserGuideSidebar />
		</Stack>
	);
};

export default HomeLayout;
