import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@emotion/react";
import lightTheme from "./Utils/Theme/lightTheme";
import darkTheme from "./Utils/Theme/darkTheme";
import { CssBaseline, GlobalStyles } from "@mui/material";
import { getAppSettings } from "./Features/Settings/settingsSlice";
import { logger } from "./Utils/Logger"; // Import the logger
import { networkService } from "./main";
import { Routes } from "./Routes";
import WalletProvider from "./Components/WalletProvider";
import { useTranslation } from "react-i18next";
import { setLanguage } from "./Features/UI/uiSlice";

function App() {
	const mode = useSelector((state) => state.ui.mode);
	const { authToken } = useSelector((state) => state.auth);
	const dispatch = useDispatch();
	const { i18n } = useTranslation();

	useEffect(() => {
		if (authToken) {
			dispatch(getAppSettings({ authToken })).then((action) => {
				if (action.payload && action.payload.success) {
						const { language } = action.payload.data;
				const availableLanguages = Object.keys(i18n.options.resources || {});
					if (language && availableLanguages.includes(language)) {
						dispatch(setLanguage(language));
						i18n.changeLanguage(language);
					} else {
						dispatch(setLanguage(availableLanguages[0]));
						i18n.changeLanguage(availableLanguages[0]);
					}
				}
			});
		}
	}, [dispatch, authToken, i18n]);

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
				<GlobalStyles
					styles={({ palette }) => {
						return {
							body: {
								backgroundImage: `radial-gradient(circle, ${palette.gradient.color1}, ${palette.gradient.color2}, ${palette.gradient.color3}, ${palette.gradient.color4}, ${palette.gradient.color5})`,
								color: palette.primary.contrastText,
							},
						};
					}}
				/>
				<Routes />
				<ToastContainer />
			</WalletProvider>
		</ThemeProvider>
	);
}

export default App;
