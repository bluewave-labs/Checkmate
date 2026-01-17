import Sidebar from "../../Sidebar/index.jsx";
import { Outlet } from "react-router";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { UserGuideSidebar } from "../../UserGuide";

const HomeLayout = () => {
	const theme = useTheme();

	return (
		<Stack
			flexDirection="row"
			gap={14}
			sx={{
				position: "relative",
				minHeight: "100vh",
				margin: "0 auto",
				padding: 0,
				overflowX: "hidden",
				width: "100%",
				"& > div": {
					minHeight: `calc(100vh - ${theme.spacing(4)} * 2)`,
					flex: 1,
				},
			}}
		>
			<Sidebar />
			<Stack
				sx={{
					padding: theme.spacing(4),
					maxWidth: 1400,
					margin: "0 auto",
					flex: 1,
					minWidth: 0,
					overflowX: "hidden",
				}}
			>
				<Outlet />
			</Stack>
			<UserGuideSidebar />
		</Stack>
	);
};

export default HomeLayout;
