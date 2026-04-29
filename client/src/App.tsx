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
						".Toastify__progress-bar": {
							height: 2,
							bottom: 0,
							top: "auto",
						},
						".Toastify__progress-bar--bg": {
							display: "none",
						},
					}}
				/>
				<AppLayout>
					<Routes />
				</AppLayout>
				<ToastContainer
					newestOnTop={true}
					theme={mode}
					icon={false}
					style={
						{
							"--toastify-color-progress-light": theme.palette.primary.main,
							"--toastify-color-progress-dark": theme.palette.primary.main,
							"--toastify-toast-min-height": "40px",
							"--toastify-toast-padding": "8px 12px",
							"--toastify-toast-width": "auto",
						} as CSSProperties
					}
					toastStyle={{
						minHeight: 40,
						padding: "8px 12px",
						width: "auto",
						maxWidth: "min(560px, calc(100vw - 32px))",
					}}
					progressStyle={{ height: 2 }}
				/>
			</ThemeProvider>
		</SWRConfig>
	);
}

export default App;
