import { type CSSProperties } from "react";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { SWRConfig } from "swr";
import { Routes } from "./Routes";
import AppLayout from "@/Components/layout/AppLayout";
import type { RootState } from "@/Types/state";
import { lightTheme, darkTheme } from "@/Utils/Theme/Theme";

const swrConfig = {
	dedupingInterval: 5000,
	revalidateOnFocus: false,
	revalidateOnReconnect: true,
	shouldRetryOnError: false,
	errorRetryCount: 2,
	errorRetryInterval: 1000,
	focusThrottleInterval: 5000,
};

function App() {
	const mode = useSelector((state: RootState) => state.ui.mode);
	const theme = mode === "light" ? lightTheme : darkTheme;

	return (
		<SWRConfig value={swrConfig}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<GlobalStyles
					styles={{
						body: {
							backgroundColor: theme.palette.background.default,
						},
					}}
				/>
				<AppLayout>
					<Routes />
				</AppLayout>
				<ToastContainer
					newestOnTop={true}
					theme={mode}
					style={
						{
							"--toastify-color-progress-light": theme.palette.primary.main,
							"--toastify-color-progress-dark": theme.palette.primary.main,
						} as CSSProperties
					}
				/>
			</ThemeProvider>
		</SWRConfig>
	);
}

export default App;
