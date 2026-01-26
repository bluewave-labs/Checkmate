import { useEffect } from "react";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@emotion/react";
import lightTheme from "./Utils/Theme/lightTheme";
import darkTheme from "./Utils/Theme/darkTheme";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { logger } from "./Utils/Logger"; // Import the logger
import { networkService } from "./main";
import { Routes } from "./Routes";
import AppLayout from "@/Components/v1/Layouts/AppLayout";

function App() {
	const mode = useSelector((state) => state.ui.mode);

	// Cleanup
	useEffect(() => {
		return () => {
			logger.cleanup();
			networkService.cleanup();
		};
	}, []);

	const theme = mode === "light" ? lightTheme : darkTheme;

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles
				styles={{
					body: {
						backgroundColor: theme.palette.background.main,
					},
				}}
			/>
			<AppLayout>
				<Routes />
			</AppLayout>
			<ToastContainer
				newestOnTop={true}
				theme={mode}
				style={{
					"--toastify-color-progress-light": "#7C8BA1",
					"--toastify-color-progress-dark": "#7C8BA1",
				}}
			/>
		</ThemeProvider>
	);
}

export default App;
