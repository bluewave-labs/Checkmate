import { createTheme } from "@mui/material";
import { lightPalette, darkPalette, typographyLevels } from "./palette";
const fontFamilyPrimary = '"Inter" , sans-serif';

export const theme = (mode: string, palette: any) =>
	createTheme({
		spacing: 2,
		palette: {
			mode: mode,
			...palette,
		},
		typography: {
			fontFamily: fontFamilyPrimary,
			fontSize: typographyLevels.base,
		},

		components: {
			MuiFormLabel: {
				styleOverrides: {
					root: ({ theme }) => ({
						fontSize: typographyLevels.base,
						"&.Mui-focused": {
							color: theme.palette.secondary.contrastText,
						},
					}),
				},
			},
			MuiInputLabel: {
				styleOverrides: {
					root: ({ theme }) => ({
						top: `-${theme.spacing(4)}`,
						"&.MuiInputLabel-shrink": {
							top: 0,
						},
					}),
				},
			},
			MuiTextField: {
				styleOverrides: {
					root: () => ({
						"& .MuiOutlinedInput-root": {
							height: 34,
							fontSize: typographyLevels.base,
						},
					}),
				},
			},
		},
	});

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
