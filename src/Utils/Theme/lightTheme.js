import { createTheme } from "@mui/material";
import { baseTheme } from "./globalTheme";
import { /* colors, */ newSemanticColors } from "./constants";
import { extractThemeColors } from "./extractColorObject";

const palette = extractThemeColors("light", newSemanticColors);
const lightTheme = createTheme({
	palette,
	...baseTheme(palette),
});

export default lightTheme;
