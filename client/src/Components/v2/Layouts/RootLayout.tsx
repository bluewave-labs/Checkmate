import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import { SideBar } from "@/Components/v2/Layouts/Sidebar";

const RootLayout = () => {
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
