import { Routes, Route } from "react-router";
import { ThemeProvider } from "@emotion/react";
import { lightTheme, darkTheme } from "@/Utils/Theme/v2/theme";

// v2 pages
import AuthLoginV2 from "@/Pages/v2/Auth/Login";
import AuthRegisterV2 from "@/Pages/v2/Auth/Register";
// import other v2 pages here...

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
			</Routes>
		</ThemeProvider>
	);
};

export default V2Routes;
