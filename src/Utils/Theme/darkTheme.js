import { createTheme } from "@mui/material";
import { baseTheme } from "./globalTheme";
import { /* colors, */ newSemanticColors } from "./constants";
import { extractThemeColors } from "./extractColorObject";

const palette = extractThemeColors("dark", newSemanticColors);

const darkTheme = createTheme({
	palette,
	...baseTheme(palette),
});

export default darkTheme;
