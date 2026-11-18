import { createTheme } from "@mui/material";
import {
	lightPalette,
	darkPalette,
	typographyLevels,
	type SignalKey,
	type SignalTone,
} from "@/Utils/Theme/Palette";

import type { PaletteMode, PaletteOptions, Theme } from "@mui/material/styles";
import type {} from "@mui/material/styles";
import { SCROLLBAR_SIZE } from "@/Utils/Theme/constants";

interface NeutralPalette {
	raised: string;
	hairline: string;
	border: string;
	borderHover: string;
	rowDivider: string;
	icon: string;
	tertiary: string;
	subdued: string;
	hoverGreen: string;
	selectedGreen: string;
	tooltip: string;
	sortedCell: string;
}

interface ChartPalette {
	phases: {
		dns: string;
		tcp: string;
		tls: string;
		request: string;
		firstByte: string;
		download: string;
	};
	series: readonly string[];
	score: readonly string[];
}

declare module "@mui/material/styles" {
	interface TypographyVariants {
		eyebrow: React.CSSProperties;
		fontFamilyMonospace: string;
	}
	interface TypographyVariantsOptions {
		eyebrow?: React.CSSProperties;
		fontFamilyMonospace?: string;
	}
	interface TypeAction {
		rowHover: string;
		controlHover: string;
		selectedHover: string;
	}
	interface Palette {
		neutral: NeutralPalette;
		signal: Record<SignalKey, SignalTone>;
		sidebar: { accent: string };
		scrollbar: { track: string; thumb: string };
		rowStatus: { running: string; paused: string };
		chart: ChartPalette;
	}
	interface PaletteOptions {
		neutral?: NeutralPalette;
		signal?: Record<SignalKey, SignalTone>;
		sidebar?: { accent: string };
		scrollbar?: { track: string; thumb: string };
		rowStatus?: { running: string; paused: string };
		chart?: ChartPalette;
	}
}

declare module "@mui/material/Typography" {
	interface TypographyPropsVariantOverrides {
		eyebrow: true;
	}
}

export type PaletteKey = {
	[K in keyof Theme["palette"]]: Theme["palette"][K] extends { main: any } ? K : never;
}[keyof Theme["palette"]];

const fontFamilyPrimary = '"Geist Variable", system-ui, sans-serif';
const fontFamilyMonospace =
	'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
export const shadow =
	"0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

export const theme = (mode: PaletteMode, palette: PaletteOptions) =>
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
			fontFamilyMonospace,
			fontSize: typographyLevels.base,
			h1: {
				fontSize: typographyLevels.xxxl,
				fontWeight: 600,
				lineHeight: 1.3,
				letterSpacing: "-0.02em",
			},
			h2: { fontSize: typographyLevels.l, fontWeight: 600, lineHeight: 1.4 },
			body1: { fontSize: typographyLevels.m, fontWeight: 400, lineHeight: 1.5 },
			body2: { fontSize: typographyLevels.sm, fontWeight: 400, lineHeight: 1.5 },
			eyebrow: {
				fontSize: typographyLevels.s,
				fontWeight: 500,
				textTransform: "uppercase",
				letterSpacing: "0.07em",
				lineHeight: 1.4,
			},
		},

		components: {
			MuiCssBaseline: {
				styleOverrides: (theme) => ({
					html: { overflowY: "scroll" },
					"*:focus:not(:focus-visible)": { outline: "none" },
					"*": {
						scrollbarWidth: "auto",
						scrollbarColor: `${theme.palette.scrollbar.thumb} ${theme.palette.scrollbar.track}`,
					},
					"*::-webkit-scrollbar": {
						width: SCROLLBAR_SIZE,
						height: SCROLLBAR_SIZE,
					},
					"*::-webkit-scrollbar-track": {
						background: theme.palette.scrollbar.track,
						borderRadius: theme.shape.borderRadius,
					},
					"*::-webkit-scrollbar-thumb": {
						background: theme.palette.scrollbar.thumb,
						borderRadius: theme.shape.borderRadius,
					},
					"*::-webkit-scrollbar-button": { display: "none" },
				}),
			},
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
			MuiIconButton: {
				styleOverrides: {
					root: ({ theme }) =>
						theme.unstable_sx({
							borderRadius: theme.shape.borderRadius,
							"&:hover": { backgroundColor: theme.palette.neutral.selectedGreen },
							"&.Mui-focusVisible": {
								outline: `2px solid ${theme.palette.primary.main}`,
								outlineOffset: 1,
							},
						}),
				},
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
					input: {
						paddingTop: 0,
						paddingBottom: 0,
						height: "100%",
					},
					root: ({ theme }) => ({
						...theme.unstable_sx({ borderRadius: theme.shape.borderRadius }),
						backgroundColor: theme.palette.background.paper,
						"&.MuiInputBase-root:has(.MuiSelect-select)": {
							cursor: "pointer",
						},
						"& .MuiSelect-select": {
							paddingTop: 0,
							paddingBottom: 0,
							display: "flex",
							alignItems: "center",
							minHeight: "unset",
							alignSelf: "stretch",
						},
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: theme.palette.neutral.border,
							transition: "border-color 0.15s ease",
						},
						"&:hover:not(.Mui-focused):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline":
							{
								borderColor: theme.palette.neutral.borderHover,
							},
						"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
							borderColor:
								theme.palette.mode === "dark"
									? theme.palette.primary.light
									: theme.palette.primary.main,
							borderWidth: 2,
						},
						"&.Mui-error .MuiOutlinedInput-notchedOutline": {
							borderColor: theme.palette.error.main,
						},
					}),
				},
			},

			MuiPaper: {
				styleOverrides: {
					root: ({ theme }) => {
						return {
							...theme.unstable_sx({ borderRadius: theme.shape.borderRadius }),
							marginTop: 4,
							padding: 0,
							border: 1,
							borderStyle: "solid",
							borderColor: theme.palette.divider,
							boxShadow: "none",
							backgroundColor: theme.palette.background.paper,
							backgroundImage: "none",
						};
					},
				},
			},
			MuiPopover: { styleOverrides: { paper: { boxShadow: shadow } } },
			MuiMenu: {
				styleOverrides: {
					paper: { boxShadow: shadow },
					list: { paddingTop: 0, paddingBottom: 0 },
				},
			},
			MuiDialog: {
				styleOverrides: {
					paper: ({ theme }) =>
						theme.unstable_sx({ borderRadius: theme.shape.borderRadius }),
				},
			},
		},
		shape: {
			borderRadius: 2,
		},
	});

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
