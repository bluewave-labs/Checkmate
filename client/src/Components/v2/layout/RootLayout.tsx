import { Sidebar } from "@/Components/v2/sidebar";
import { Outlet } from "react-router";
import Stack from "@mui/material/Stack";
import { useMediaQuery } from "@mui/material";
import { useSidebar } from "@/Hooks/useSidebar";

import { useSelector } from "react-redux";
import type { RootState } from "@/Types/state";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2Theme";
import { ThemeProvider, useTheme } from "@mui/material";

const RootLayout = () => {
	const mode = useSelector((state: RootState) => state.ui.mode);
	const v2theme = mode === "dark" ? darkTheme : lightTheme;
	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("md"));
	const { collapsedWidth } = useSidebar();

	return (
		<Stack flexDirection="row">
			<ThemeProvider theme={v2theme}>
				<Sidebar />
			</ThemeProvider>
			<Stack
				flex={1}
				padding={6}
				overflow={"hidden"}
				sx={{
					backgroundColor:
						theme.palette.mode === "dark"
							? "rgba(255, 255, 255, 0.01)"
							: "rgba(0, 0, 0, 0.01)",
					display: "flex",
					alignItems: "center",
					paddingLeft: isSmall ? `${collapsedWidth + 12}px` : 12,
				}}
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
