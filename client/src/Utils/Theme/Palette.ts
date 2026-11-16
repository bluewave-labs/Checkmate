import { alpha } from "@mui/material/styles";
import type { PaletteOptions } from "@mui/material/styles";
import { HOVER } from "@/Utils/Theme/constants";

const typographyBase = 13;

export const typographyLevels = {
	base: typographyBase,
	s: `${(typographyBase - 2) / 16}rem`,
	sm: `${(typographyBase - 1) / 16}rem`,
	m: `${typographyBase / 16}rem`,
	l: `${(typographyBase + 1) / 16}rem`,
	xl: `${(typographyBase + 5) / 16}rem`,
	title: `${(typographyBase + 7) / 16}rem`,
	xxl: `${(typographyBase + 11) / 16}rem`,
};

export const colors = {
	green700: "#008300",
	brandGreenDark: "#075443",
	brandGreen: "#13715B",
	gray900: "#151518",
	successText: "#17703B",
	aqua600: "#199E70",
	ink900: "#1A2E2B",
	aqua500: "#1BAF7A",
	gray850: "#1c1c21",
	successMain: "#22A55A",
	gray800: "#24242A",
	rowDividerDark: "#2A2F2D",
	blue500: "#2A78D6",
	gray700: "#313131",
	ink800: "#33453F",
	blue400: "#3987E5",
	ruleDark: "#3A4642",
	ink700: "#495A56",
	ruleDarkStrong: "#4A5652",
	successDark: "#4BC49E",
	brandGreenLight: "#4DAF94",
	ink600: "#5C6D69",
	ink500: "#6B7C78",
	ink400: "#8C9893",
	warningText: "#9A4D05",
	ink300: "#A3AFAC",
	inkDark600: "#B3BCB7",
	errorText: "#B91C1C",
	rule300: "#C3C9C8",
	yellow600: "#C98500",
	magenta400: "#D55181",
	rule200: "#D8DCDB",
	orange700: "#D95926",
	green100: "#D9F2E9",
	errorMain: "#DC2626",
	successBg: "#DCF2E4",
	warningDark: "#E0A458",
	rule100: "#E6E9E8",
	magenta300: "#E87BA4",
	errorDark: "#E8837A",
	orange600: "#EB6834",
	inkDark900: "#ECEFED",
	yellow500: "#EDA100",
	gray200: "#EFEFEF",
	green50: "#EFFAF6",
	warningMain: "#F28C18",
	surface100: "#F3F6F5",
	surface50: "#FAFAFA",
	warningBg: "#FDEBD5",
	orange500: "#FFA500",
};

export const lightPalette = {
	primary: {
		main: colors.brandGreen,
		dark: colors.brandGreenDark,
		contrastText: "#FFFFFF",
	},
	action: {
		rowHover: colors.surface50,
		controlHover: colors.surface100,
		selected: colors.green100,
		selectedHover: colors.green100,
	},
	secondary: {
		main: colors.gray200,
	},
	background: {
		default: colors.surface50,
		paper: "#FFFFFF",
	},
	text: {
		primary: colors.ink900,
		secondary: colors.ink800,
		disabled: colors.ink300,
	},
	divider: colors.rule200,
	success: {
		main: colors.successMain,
		dark: colors.successText,
		contrastText: "#FFFFFF",
	},
	error: {
		main: colors.errorMain,
		dark: colors.errorText,
		contrastText: "#FFFFFF",
	},
	warning: {
		main: colors.warningMain,
		dark: colors.warningText,
		contrastText: "#FFFFFF",
	},
	neutral: {
		raised: colors.surface100,
		hairline: colors.rule200,
		border: colors.rule300,
		borderHover: colors.ink600,
		rowDivider: colors.rule100,
		icon: colors.ink500,
		tertiary: colors.ink700,
		subdued: colors.ink400,
		hoverGreen: colors.green50,
		selectedGreen: colors.green100,
		tooltip: colors.ink900,
	},
	sidebar: {
		accent: colors.brandGreen,
	},
	scrollbar: {
		track: "transparent",
		thumb: colors.rule300,
	},
	rowStatus: {
		running: colors.successBg,
		paused: colors.warningBg,
	},
	chart: {
		phases: {
			dns: colors.magenta300,
			tcp: colors.orange600,
			tls: colors.aqua500,
			request: colors.yellow500,
			firstByte: colors.blue500,
			download: colors.green700,
		},
	},
} satisfies PaletteOptions;

export const darkPalette = {
	primary: {
		main: colors.brandGreen,
		light: colors.brandGreenLight,
	},
	action: {
		rowHover: alpha("#FFFFFF", HOVER.ROW),
		controlHover: alpha("#FFFFFF", HOVER.CONTROL),
		selected: alpha(colors.brandGreenLight, 0.07),
		selectedHover: alpha(colors.brandGreenLight, 0.11),
	},
	secondary: {
		main: colors.gray700,
	},
	background: {
		default: colors.gray900,
		paper: colors.gray850,
	},
	text: {
		primary: colors.inkDark900,
		secondary: colors.inkDark600,
		disabled: colors.ink400,
	},
	divider: colors.ruleDark,
	success: {
		main: colors.successDark,
	},
	error: {
		main: colors.errorDark,
	},
	warning: {
		main: colors.warningDark,
	},
	neutral: {
		raised: colors.gray800,
		hairline: colors.ruleDark,
		border: colors.ruleDarkStrong,
		borderHover: colors.inkDark600,
		rowDivider: colors.rowDividerDark,
		icon: colors.inkDark600,
		tertiary: colors.inkDark600,
		subdued: colors.ink400,
		hoverGreen: alpha(colors.brandGreenLight, 0.07),
		selectedGreen: alpha(colors.brandGreenLight, 0.14),
		tooltip: colors.gray700,
	},
	sidebar: {
		accent: colors.brandGreenLight,
	},
	scrollbar: {
		track: "transparent",
		thumb: colors.ruleDarkStrong,
	},
	rowStatus: {
		running: alpha(colors.brandGreen, 0.18),
		paused: alpha(colors.orange500, 0.18),
	},
	chart: {
		phases: {
			dns: colors.magenta400,
			tcp: colors.orange700,
			tls: colors.aqua600,
			request: colors.yellow600,
			firstByte: colors.blue500,
			download: colors.green700,
		},
	},
} satisfies PaletteOptions;
