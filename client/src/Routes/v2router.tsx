import { Routes, Route } from "react-router";
import { ThemeProvider } from "@emotion/react";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2/theme";

import AuthLoginV2 from "@/Pages/v2/Auth/Login";
import AuthRegisterV2 from "@/Pages/v2/Auth/Register";
import UptimeMonitorsPage from "@/Pages/v2/Uptime/UptimeMonitors";
import UptimeCreatePage from "@/Pages/v2/Uptime/Create";
import UptimeDetailsPage from "@/Pages/v2/Uptime/Details";
import RootLayout from "@/Components/v2/Layouts/RootLayout";

const V2Routes = ({ mode = "light" }) => {
	const v2Theme = mode === "light" ? lightTheme : darkTheme;

	return (
		<ThemeProvider theme={v2Theme}>
			<Routes>
				<Route
					path="login"
					element={<AuthLoginV2 />}
				/>
				<Route
					path="register"
					element={<AuthRegisterV2 />}
				/>
				<Route
					path="/"
					element={<RootLayout />}
				>
					<Route
						index
						element={<UptimeMonitorsPage />}
					/>
					<Route
						path="uptime"
						element={<UptimeMonitorsPage />}
					/>
					<Route
						path="uptime/:id"
						element={<UptimeDetailsPage />}
					/>
					<Route
						path="uptime/create"
						element={<UptimeCreatePage />}
					/>
				</Route>
			</Routes>
		</ThemeProvider>
	);
};

export default V2Routes;
