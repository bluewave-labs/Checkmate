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
			h1: {
				fontSize: typographyLevels.xl,
				color: palette.primary.contrastText,
				fontWeight: 500,
			},
			h2: {
				fontSize: typographyLevels.l,
				color: palette.primary.contrastTextSecondary,
				fontWeight: 400,
			},

			body1: {
				fontSize: typographyLevels.m,
				color: palette.primary.contrastTextTertiary,
				fontWeight: 400,
			},
			body2: {
				fontSize: typographyLevels.s,
				color: palette.primary.contrastTextTertiary,
				fontWeight: 400,
			},
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
			MuiRadio: {
				styleOverrides: {
					root: {
						padding: 0,
						"& .MuiSvgIcon-root": {
							fontSize: 16,
						},
					},
				},
			},
		},
		shape: {
			borderRadius: 2,
		},
	});

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
