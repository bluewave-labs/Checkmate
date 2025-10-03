import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import { SideBar } from "@/Components/v2/Layouts/Sidebar";
import { useTheme } from "@mui/material/styles";
const RootLayout = () => {
	const theme = useTheme();
	return (
		<Stack
			overflow={"hidden"}
			direction="row"
			minHeight="100vh"
		>
			<SideBar />
			<Stack
				flex={1}
				padding={theme.spacing(12)}
			>
				<Outlet />
			</Stack>
		</Stack>
	);
};

export default RootLayout;
