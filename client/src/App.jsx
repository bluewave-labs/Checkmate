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
import WalletProvider from "./Components/WalletProvider";
import AppLayout from "./Components/Layouts/AppLayout";

function App() {
	const mode = useSelector((state) => state.ui.mode);

	// Cleanup
	useEffect(() => {
		return () => {
			logger.cleanup();
			networkService.cleanup();
		};
	}, []);

	return (
		/* Extract Themeprovider, baseline and global styles to Styles */
		<ThemeProvider theme={mode === "light" ? lightTheme : darkTheme}>
			<WalletProvider>
				<CssBaseline />

				<AppLayout>
					<Routes />
				</AppLayout>
				<ToastContainer />
			</WalletProvider>
		</ThemeProvider>
	);
}

export default App;
