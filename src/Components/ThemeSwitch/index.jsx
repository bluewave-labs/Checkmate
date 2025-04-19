/**
 * ThemeSwitch Component
 * Dark and Light Theme Switch
 * Original Code: https://web.dev/patterns/theming/theme-switch
 * License: Apache License 2.0
 * Copyright © Google LLC
 *
 * This code has been adapted for use in this project.
 * Apache License: https://www.apache.org/licenses/LICENSE-2.0
 */

import { IconButton } from "@mui/material";
import SunAndMoonIcon from "./SunAndMoonIcon";
import { useDispatch, useSelector } from "react-redux";
import { setMode } from "../../Features/UI/uiSlice";
import "./index.css";

const ThemeSwitch = ({ width = 48, height = 48, color }) => {
	const mode = useSelector((state) => state.ui.mode);
	const dispatch = useDispatch();

	const toggleTheme = () => {
		dispatch(setMode(mode === "light" ? "dark" : "light"));
	};

	return (
		<IconButton
			id="theme-toggle"
			title="Toggles light & dark"
			className={`theme-${mode}`}
			aria-label="auto"
			aria-live="polite"
			onClick={toggleTheme}
			sx={{
				width,
				height,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				"& svg >:is(circle, g)": {
					fill: color,
					stroke: color,
				},
			}}
		>
			<SunAndMoonIcon />
		</IconButton>
	);
};

export default ThemeSwitch;
