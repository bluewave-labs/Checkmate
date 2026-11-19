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
	xxl: `${(typographyBase + 7) / 16}rem`,
	xxxl: `${(typographyBase + 11) / 16}rem`,
};

export const colors = {
	teal600: "#008B91",
	brandGreenDark: "#075443",
	brandGreen: "#13715B",
	gray900: "#151518",
	successText: "#17703B",
	green800: "#187340",
	cyan700: "#196F86",
	ink900: "#1A2E2B",
	gray850: "#1c1c21",
	green600: "#1D8A4C",
	cyan600: "#208DAA",
	successMain: "#22A55A",
	gray800: "#24242A",
	rowDividerDark: "#2A2F2D",
	blue600: "#2A82B7",
	blue700: "#2D6F99",
	gray700: "#313131",
	ink800: "#33453F",
	blue400: "#3987E5",
	ruleDark: "#3A4642",
	ink700: "#495A56",
	ruleDarkStrong: "#4A5652",
	successDark: "#4BC49E",
	brandGreenLight: "#4DAF94",
	green500: "#59B051",
	ink600: "#5C6D69",
	indigo500: "#6076BE",
	ink500: "#6B7C78",
	olive500: "#6B8632",
	lime500: "#7EBA43",
	blue300: "#7FB8DE",
	amber900: "#85590F",
	purple500: "#8A67B1",
	ink400: "#8C9893",
	blue200: "#8CC8EE",
	olive700: "#90790F",
	warningText: "#9A4D05",
	plum500: "#A0609B",
	ink300: "#A3AFAC",
	lime600: "#A4BD34",
	green200: "#A6DDB9",
	rose600: "#AE5B7E",
	rust500: "#B36043",
	inkDark600: "#B3BCB7",
	errorText: "#B91C1C",
	blue100: "#BFE0F5",
	rule300: "#C3C9C8",
	lime700: "#C9B925",
	rule250: "#C9D1CF",
	rule200: "#D8DCDB",
	green100: "#D9F2E9",
	errorMain: "#DC2626",
	successBg: "#DCF2E4",
	amber700: "#E09B26",
	warningDark: "#E0A458",
	blue50: "#E3F2FC",
	orange650: "#E65723",
	rule100: "#E6E9E8",
	errorDark: "#E8837A",
	yellow400: "#EAB308",
	inkDark900: "#ECEFED",
	yellow500: "#EDA100",
	orange550: "#EE7B1D",
	surface200: "#EEF1F0",
	gray200: "#EFEFEF",
	green50: "#EFFAF6",
	amber600: "#F19416",
	warningMain: "#F28C18",
	surface100: "#F3F6F5",
	red200: "#F5B5B5",
	green25: "#F7FBF9",
	orange200: "#F8C98F",
	surface50: "#FAFAFA",
	red100: "#FDE2E2",
	warningBg: "#FDEBD5",
	orange500: "#FFA500",
};

export const SignalKeys = ["success", "error", "warning", "neutral", "info"] as const;
export type SignalKey = (typeof SignalKeys)[number];
export type SignalTone = { bg: string; text: string; border: string; mark: string };

export const toSignalKey = (palette: string): SignalKey =>
	(SignalKeys as readonly string[]).includes(palette)
		? (palette as SignalKey)
		: "neutral";

// **************************
// Chart colors
// **************************

const chartSeries = [
	colors.indigo500,
	colors.rose600,
	colors.olive700,
	colors.teal600,
	colors.rust500,
	colors.purple500,
	colors.olive500,
	colors.blue600,
	colors.plum500,
] as const;

const chartPhases = {
	dns: chartSeries[0],
	tcp: chartSeries[1],
	tls: chartSeries[2],
	request: chartSeries[3],
	firstByte: chartSeries[4],
	download: chartSeries[5],
};

const scoreSpectrum = [
	colors.errorMain,
	colors.orange650,
	colors.orange550,
	colors.amber600,
	colors.yellow500,
	colors.yellow400,
	colors.lime700,
	colors.lime600,
	colors.lime500,
	colors.green500,
	colors.successMain,
] as const;

export const getScoreColor = (spectrum: readonly string[], score: number): string => {
	const clamped = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
	return spectrum[Math.round((clamped / 100) * (spectrum.length - 1))];
};

export const SidebarGroupKeys = ["monitoring", "alerting", "reporting"] as const;
export type SidebarGroupKey = (typeof SidebarGroupKeys)[number];
export type GroupTone = {
	solid: string;
	text: string;
};

const lightGroups: Record<SidebarGroupKey, GroupTone> = {
	monitoring: { solid: colors.cyan600, text: colors.cyan700 },
	alerting: { solid: colors.amber700, text: colors.amber900 },
	reporting: { solid: colors.green600, text: colors.green800 },
};

const darkGroups: Record<SidebarGroupKey, GroupTone> = {
	monitoring: { solid: colors.cyan600, text: colors.cyan600 },
	alerting: { solid: colors.amber700, text: colors.amber700 },
	reporting: { solid: colors.green600, text: colors.green600 },
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
	info: {
		main: colors.blue700,
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
		sortedCell: colors.green25,
	},
	signal: {
		success: {
			bg: colors.successBg,
			text: colors.successText,
			border: colors.green200,
			mark: colors.successMain,
		},
		error: {
			bg: colors.red100,
			text: colors.errorText,
			border: colors.red200,
			mark: colors.errorMain,
		},
		warning: {
			bg: colors.warningBg,
			text: colors.warningText,
			border: colors.orange200,
			mark: colors.warningMain,
		},
		neutral: {
			bg: colors.surface200,
			text: colors.ink700,
			border: colors.rule250,
			mark: colors.rule250,
		},
		info: {
			bg: colors.blue50,
			text: colors.blue700,
			border: colors.blue100,
			mark: colors.blue200,
		},
	},
	accent: colors.brandGreen,
	sidebar: {
		groups: lightGroups,
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
		phases: chartPhases,
		series: chartSeries,
		score: scoreSpectrum,
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
	info: {
		main: colors.blue300,
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
		sortedCell: alpha(colors.brandGreenLight, 0.04),
	},
	signal: {
		success: {
			bg: alpha(colors.successDark, 0.14),
			text: colors.successDark,
			border: alpha(colors.successDark, 0.35),
			mark: colors.successDark,
		},
		error: {
			bg: alpha(colors.errorDark, 0.14),
			text: colors.errorDark,
			border: alpha(colors.errorDark, 0.35),
			mark: colors.errorDark,
		},
		warning: {
			bg: alpha(colors.warningDark, 0.14),
			text: colors.warningDark,
			border: alpha(colors.warningDark, 0.35),
			mark: colors.warningDark,
		},
		neutral: {
			bg: alpha("#FFFFFF", 0.06),
			text: colors.inkDark600,
			border: colors.ruleDark,
			mark: colors.inkDark600,
		},
		info: {
			bg: alpha(colors.blue300, 0.14),
			text: colors.blue300,
			border: alpha(colors.blue300, 0.35),
			mark: colors.blue300,
		},
	},
	accent: colors.brandGreenLight,
	sidebar: {
		groups: darkGroups,
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
		phases: chartPhases,
		series: chartSeries,
		score: scoreSpectrum,
	},
} satisfies PaletteOptions;
