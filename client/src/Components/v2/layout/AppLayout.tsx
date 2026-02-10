import Box from "@mui/material/Box";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";
import BackgroundSVG from "@/assets/Images/background.svg";
import type { RootState } from "@/Types/state";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2Theme";
import { OfflineBanner } from "@/Components/v2/design-elements";

interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const theme = useTheme();
	const mode = useSelector((state: RootState) => state.ui.mode);
	const v2theme = mode === "dark" ? darkTheme : lightTheme;

	return (
		<ThemeProvider theme={v2theme}>
			<Box
				sx={{
					minHeight: "100vh",
					// @ts-expect-error custom palette property
					backgroundColor: theme.palette.primaryBackground.main,
					backgroundImage: mode === "dark" ? `url("${BackgroundSVG}")` : "none",
					backgroundSize: "100% 100%",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
					color: theme.palette.primary.contrastText,
				}}
			>
				<OfflineBanner visible={false} />
				{children}
			</Box>
		</ThemeProvider>
	);
};

export default AppLayout;
