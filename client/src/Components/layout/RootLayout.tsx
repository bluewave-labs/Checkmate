import { Sidebar } from "@/Components/sidebar";
import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import { useMediaQuery } from "@mui/material";
import { useSidebar } from "@/Hooks/useSidebar";

import { useTheme } from "@mui/material";

const RootLayout = () => {
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { collapsedWidth } = useSidebar();

	return (
		<Stack flexDirection="row">
			<Sidebar />
			<Stack
				flex={1}
				padding={6}
				overflow={"hidden"}
				bgcolor={
					theme.palette.mode === "dark"
						? "rgba(255, 255, 255, 0.01)"
						: "rgba(124, 116, 116, 0.01)"
				}
				alignItems="center"
				paddingLeft={isSmall ? `${collapsedWidth + 12}px` : 12}
			>
				<Stack
					maxWidth={1280}
					width="100%"
					paddingY={theme.spacing(6)}
					flex={1}
				>
					<Outlet />
				</Stack>
			</Stack>
		</Stack>
	);
};

export default RootLayout;
