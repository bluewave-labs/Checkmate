import { Routes, Route } from "react-router";
import { ThemeProvider } from "@emotion/react";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2/theme";

import AuthLoginV2 from "@/Pages/v2/Auth/Login";
import AuthRegisterV2 from "@/Pages/v2/Auth/Register";
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
					element={<RootLayout mode={mode} />}
				>
					<Route
						path="test"
						element={<h1>Test Page</h1>}
					/>
				</Route>
			</Routes>
		</ThemeProvider>
	);
};

export default V2Routes;
