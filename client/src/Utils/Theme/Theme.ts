import { createTheme } from "@mui/material";
import { lightPalette, darkPalette, typographyLevels } from "@/Utils/Theme/Palette";

import type { Theme } from "@mui/material/styles";

export type PaletteKey = {
	[K in keyof Theme["palette"]]: Theme["palette"][K] extends { main: any } ? K : never;
}[keyof Theme["palette"]];

const fontFamilyPrimary = "system-ui, sans-serif";
const shadow =
	"0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

export const theme = (mode: string, palette: any) =>
	createTheme({
		breakpoints: {
			values: {
				xs: 300,
				sm: 600,
				md: 900,
				lg: 1200,
				xl: 1536,
			},
		},
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
				fontWeight: 500,
			},
			h2: {
				fontSize: typographyLevels.l,
				fontWeight: 400,
			},
			body1: {
				fontSize: typographyLevels.m,
				fontWeight: 400,
			},
			body2: {
				fontSize: typographyLevels.s,
				fontWeight: 400,
			},
		},

		components: {
			MuiTouchRipple: {
				styleOverrides: {
					root: {
						display: "none",
					},
				},
			},
			MuiButtonBase: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
				},
			},
			MuiButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
			},
			MuiIconButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
			},
			MuiListItemButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
				},
			},
			MuiTab: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
			},
			MuiToggleButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
			},

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

			MuiOutlinedInput: {
				styleOverrides: {
					root: ({ theme }) => ({
						"&:hover .MuiOutlinedInput-notchedOutline": {
							borderColor:
								theme.palette.mode === "dark"
									? "rgba(255, 255, 255, 0.23)"
									: theme.palette.text.primary,
						},
						"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
							borderColor: palette.primary.main,
						},
					}),
				},
			},

			MuiPaper: {
				styleOverrides: {
					root: ({ theme }) => {
						return {
							marginTop: 4,
							padding: 0,
							border: 1,
							borderStyle: "solid",
							borderColor: theme.palette.divider,
							borderRadius: 4,
							boxShadow: shadow,
							backgroundColor: theme.palette.background.paper,
							backgroundImage: "none",
						};
					},
				},
			},

			MuiSwitch: {
				defaultProps: { disableRipple: true },
				styleOverrides: {
					root: {
						width: 36,
						height: 20,
						padding: "0 6px 0 0",
						boxSizing: "content-box",
						overflow: "visible",
					},
					switchBase: ({ theme }) => ({
						padding: 2,
						"&.Mui-checked": {
							transform: "translateX(16px)",
							color: "#fff",
							"& + .MuiSwitch-track": {
								backgroundColor: theme.palette.primary.main,
								opacity: 1,
								border: 0,
							},
						},
					}),
					thumb: {
						width: 16,
						height: 16,
						boxShadow: "0 1px 2px rgba(16, 24, 40, 0.1)",
					},
					track: ({ theme }) => ({
						borderRadius: 999,
						backgroundColor:
							theme.palette.mode === "dark"
								? "rgba(255,255,255,0.16)"
								: theme.palette.action.disabledBackground,
						opacity: 1,
					}),
				},
			},

			MuiRadio: {
				defaultProps: { disableRipple: true },
				styleOverrides: {
					root: ({ theme }) => ({
						padding: theme.spacing(2),
						color: theme.palette.divider,
						"& .MuiSvgIcon-root": {
							fontSize: 20,
							transition: "none",
						},
						"&.Mui-checked": {
							color: theme.palette.primary.main,
						},
						"&.Mui-checked .MuiSvgIcon-root:last-of-type": {
							transform: "scale(0.6)",
						},
					}),
				},
			},

			MuiSlider: {
				styleOverrides: {
					root: ({ theme }) => ({
						height: 4,
						padding: "13px 0",
						color: theme.palette.primary.main,
					}),
					rail: ({ theme }) => ({
						height: 4,
						borderRadius: 999,
						opacity: 1,
						backgroundColor:
							theme.palette.mode === "dark"
								? "rgba(255,255,255,0.16)"
								: theme.palette.action.disabledBackground,
					}),
					track: {
						height: 4,
						borderRadius: 999,
						border: "none",
					},
					thumb: ({ theme }) => ({
						width: 18,
						height: 18,
						backgroundColor: theme.palette.background.paper,
						border: `2px solid ${theme.palette.primary.main}`,
						boxShadow: "0 1px 2px rgba(16, 24, 40, 0.1)",
						"&:hover, &.Mui-focusVisible": {
							boxShadow: `0 0 0 6px ${theme.palette.primary.main}1f`,
						},
						"&.Mui-active": {
							boxShadow: `0 0 0 8px ${theme.palette.primary.main}29`,
						},
						"&::before": { display: "none" },
					}),
					mark: ({ theme }) => ({
						width: 2,
						height: 2,
						borderRadius: 999,
						backgroundColor: theme.palette.text.disabled,
						opacity: 0.5,
					}),
					markActive: ({ theme }) => ({
						backgroundColor: theme.palette.primary.main,
						opacity: 0.5,
					}),
				},
			},
		},
		shape: {
			borderRadius: 2,
		},
	});

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
