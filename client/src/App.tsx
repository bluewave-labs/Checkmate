import { type CSSProperties } from "react";
import { useSelector } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { Routes } from "./Routes";
import AppLayout from "@/Components/v2/layout/AppLayout";
import type { RootState } from "@/Types/state";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2Theme";

function App() {
	const mode = useSelector((state: RootState) => state.ui.mode);
	const v2theme = mode === "light" ? lightTheme : darkTheme;

	return (
		<ThemeProvider theme={v2theme}>
			<CssBaseline />
			<GlobalStyles
				styles={{
					body: {
						backgroundColor: v2theme.palette.background.default,
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
						"--toastify-color-progress-light": "#7C8BA1",
						"--toastify-color-progress-dark": "#7C8BA1",
					} as CSSProperties
				}
			/>
		</ThemeProvider>
	);
}

export default App;
