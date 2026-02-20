import IconButton from "@mui/material/IconButton";

import { Moon, Sun } from "lucide-react";

import { setMode } from "@/Features/UI/uiSlice.js";
import { useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/Types/state";

export const SwitchTheme = () => {
	const mode = useSelector((state: RootState) => state.ui.mode);
	const dispatch = useDispatch();
	const theme = useTheme();

	const handleChange = () => {
		dispatch(setMode(mode === "light" ? "dark" : "light"));
	};
	return (
		<IconButton
			id="theme-toggle"
			onClick={handleChange}
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				"& svg": {
					transition: "stroke 0.2s ease",
				},
				"&:hover svg path, &:hover svg line, &:hover svg polyline, &:hover svg rect, &:hover svg circle":
					{
						stroke: theme.palette.primary.main,
					},
			}}
		>
			{mode === "light" ? (
				<Moon
					size={16}
					strokeWidth={1.5}
				/>
			) : (
				<Sun
					size={16}
					strokeWidth={1.5}
				/>
			)}
		</IconButton>
	);
};
