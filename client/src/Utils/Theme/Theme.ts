import { createTheme } from "@mui/material";
import {
	lightPalette,
	darkPalette,
	typographyLevels,
	type SignalKey,
	type SignalTone,
	type SidebarPart,
	type PartTone,
} from "@/Utils/Theme/Palette";

import type { Theme } from "@mui/material/styles";
import type {} from "@mui/material/styles";
import {
	CONTROL_HEIGHT,
	FOCUS_RING,
	FONT_WEIGHT,
	LAYOUT,
	LINE_HEIGHT,
	PADDING,
	RADIUS,
	SCROLLBAR_SIZE,
} from "@/Utils/Theme/constants";

interface NeutralTokens {
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
	sortedHeader: string;
	sortedCell: string;
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
		neutral: NeutralTokens;
		signal: Record<SignalKey, SignalTone>;
		sidebar: { accent: string; parts: Record<SidebarPart, PartTone> };
		scrollbar: { track: string; thumb: string };
		rowStatus: { running: string; paused: string };
		chart: {
			phases: {
				dns: string;
				tcp: string;
				tls: string;
				request: string;
				firstByte: string;
				download: string;
			};
		};
	}
	interface PaletteOptions {
		neutral?: NeutralTokens;
		signal?: Record<SignalKey, SignalTone>;
		sidebar?: { accent: string; parts: Record<SidebarPart, PartTone> };
		scrollbar?: { track: string; thumb: string };
		rowStatus?: { running: string; paused: string };
		chart?: {
			phases: {
				dns: string;
				tcp: string;
				tls: string;
				request: string;
				firstByte: string;
				download: string;
			};
		};
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
			fontFamilyMonospace,
			fontSize: typographyLevels.base,
			h1: {
				fontSize: typographyLevels.xxl,
				fontWeight: FONT_WEIGHT.SEMIBOLD,
				lineHeight: LINE_HEIGHT.HEADING,
				letterSpacing: "-0.02em",
			},
			h2: {
				fontSize: typographyLevels.l,
				fontWeight: FONT_WEIGHT.SEMIBOLD,
				lineHeight: LINE_HEIGHT.TITLE,
			},
			body1: {
				fontSize: typographyLevels.m,
				fontWeight: FONT_WEIGHT.REGULAR,
				lineHeight: LINE_HEIGHT.BODY,
			},
			body2: {
				fontSize: typographyLevels.sm,
				fontWeight: FONT_WEIGHT.REGULAR,
				lineHeight: LINE_HEIGHT.BODY,
			},
			eyebrow: {
				fontSize: typographyLevels.s,
				fontWeight: FONT_WEIGHT.MEDIUM,
				textTransform: "uppercase",
				letterSpacing: "0.07em",
				lineHeight: LINE_HEIGHT.TITLE,
			},
		},

		components: {
			MuiCssBaseline: {
				styleOverrides: (theme) => ({
					body: { backgroundColor: theme.palette.background.default },
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
			MuiButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
				styleOverrides: {
					root: ({ theme }) => ({
						fontSize: typographyLevels.base,
						fontWeight: FONT_WEIGHT.MEDIUM,
						textTransform: "none",
						borderRadius: RADIUS.SM,
						boxShadow: "none",
						"&:hover": { boxShadow: "none" },
						"&.Mui-focusVisible": {
							outline: `${FOCUS_RING.WIDTH}px solid ${
								theme.palette.mode === "dark"
									? theme.palette.primary.light
									: theme.palette.primary.main
							}`,
							outlineOffset: FOCUS_RING.OFFSET,
						},
					}),
					sizeSmall: {
						height: CONTROL_HEIGHT.SM,
						padding: PADDING.BUTTON_SM,
						fontSize: typographyLevels.sm,
					},
					containedPrimary: ({ theme }) => ({
						"&:hover": { backgroundColor: theme.palette.primary.dark },
						"&.Mui-disabled": {
							backgroundColor: theme.palette.neutral.hairline,
							color: theme.palette.text.disabled,
						},
					}),
				},
			},
			MuiIconButton: {
				defaultProps: {
					disableRipple: true,
					disableTouchRipple: true,
					disableFocusRipple: true,
				},
				styleOverrides: {
					root: ({ theme }) => ({
						borderRadius: RADIUS.SM,
						"&:hover": { backgroundColor: theme.palette.neutral.selectedGreen },
						"&.Mui-focusVisible": {
							outline: `${FOCUS_RING.WIDTH}px solid ${theme.palette.primary.main}`,
							outlineOffset: FOCUS_RING.OFFSET,
						},
					}),
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
				styleOverrides: {
					root: {
						fontSize: typographyLevels.base,
					},
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
						borderRadius: RADIUS.SM,
						"& .MuiOutlinedInput-notchedOutline": {
							borderColor: theme.palette.neutral.border,
							transition: "border-color 0.15s ease",
						},
						"&:hover:not(.Mui-focused):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline":
							{
								borderColor: theme.palette.neutral.border,
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
							marginTop: 4,
							padding: 0,
							border: 1,
							borderStyle: "solid",
							borderColor: theme.palette.divider,
							borderRadius: RADIUS.SM,
							boxShadow: "none",
							backgroundColor: theme.palette.background.paper,
							backgroundImage: "none",
						};
					},
				},
			},
			// Only floating surfaces keep a shadow; cards and tables are flat
			MuiPopover: { styleOverrides: { paper: { boxShadow: shadow } } },
			// Menu items carry a 2px margin, so the list itself has no vertical padding:
			// a highlighted first or last item sits 2px from the edge like the others
			MuiMenu: {
				styleOverrides: {
					paper: { boxShadow: shadow },
					list: { paddingTop: 0, paddingBottom: 0 },
				},
			},
			MuiAutocomplete: {
				styleOverrides: {
					paper: { boxShadow: shadow },
					listbox: { paddingTop: 0, paddingBottom: 0 },
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					root: ({ theme }) => ({
						fontSize: typographyLevels.base,
						color: theme.palette.text.secondary,
						padding: PADDING.MENU_ITEM,
						margin: LAYOUT.XXS,
						borderRadius: RADIUS.SM,
						"&:hover, &.Mui-selected, &.Mui-selected:hover": {
							backgroundColor: theme.palette.neutral.selectedGreen,
						},
					}),
				},
			},
			MuiTooltip: {
				styleOverrides: {
					tooltip: ({ theme }) => ({
						fontSize: typographyLevels.base,
						backgroundColor: theme.palette.neutral.tooltip,
						padding: PADDING.TOOLTIP,
						borderRadius: RADIUS.SM,
					}),
					arrow: ({ theme }) => ({ color: theme.palette.neutral.tooltip }),
				},
			},
			MuiDialog: { styleOverrides: { paper: { borderRadius: RADIUS.SM } } },
			MuiSkeleton: {
				styleOverrides: {
					root: ({ theme }) => ({ backgroundColor: theme.palette.neutral.raised }),
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
			borderRadius: 4, // keep in step with RADIUS.SM
		},
	});

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
