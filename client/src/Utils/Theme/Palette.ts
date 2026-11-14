import { alpha } from "@mui/material/styles";
import { HOVER } from "@/Utils/Theme/constants";

const typographyBase = 13;

// Allowed sizes only: 11, 12, 13, 14, 16, 18, 24 px
export const typographyLevels = {
	base: typographyBase, // 13px
	xs: `${(typographyBase - 2) / 16}rem`, // 11px
	s: `${(typographyBase - 2) / 16}rem`, // 11px
	sm: `${(typographyBase - 1) / 16}rem`, // 12px, body small and chips
	m: `${typographyBase / 16}rem`, // 13px
	l: `${(typographyBase + 1) / 16}rem`, // 14px
	xl: `${(typographyBase + 5) / 16}rem`, // 18px
	title: `${(typographyBase + 7) / 16}rem`, // 20px, page titles
	xxl: `${(typographyBase + 11) / 16}rem`, // 24px
};

// Light mode base colours. Greys are slightly green-tinted.
const lightTokens = {
	ink: "#1A2E2B",
	text2: "#33453F",
	text3: "#495A56",
	grey500: "#5C6D69",
	icon: "#6B7C78",
	subdued: "#8A9894",
	disabled: "#A3AFAC",
	border: "#C3C9C8",
	hairline: "#D8DCDB",
	rowDivider: "#E6E9E8",
	raised: "#F3F6F5",
	page: "#FAFAFA",
	white: "#FFFFFF",
	primary: "#14715B",
	primaryHover: "#075443",
	green50: "#EFFAF6",
	green100: "#D9F2E9",
	sortedCell: "#F7FBF9", // faint green behind a sorted table column
	// Signal colours: tint background, text on the tint, border, solid mark
	errorBg: "#FDE2E2",
	errorText: "#B91C1C",
	errorBorder: "#F5B5B5",
	errorMark: "#DC2626",
	warningBg: "#FDEBD5",
	warningText: "#9A4D05",
	warningBorder: "#F8C98F",
	warningMark: "#F28C18",
	successBg: "#DCF2E4",
	successText: "#17703B",
	successBorder: "#A6DDB9",
	successMark: "#22A55A",
	neutralBg: "#EEF1F0",
	neutralText: "#495A56",
	neutralBorder: "#C9D1CF",
	neutralMark: "#C9D1CF",
	infoBg: "#E3F2FC",
	infoText: "#2D6F99",
	infoBorder: "#BFE0F5",
	infoMark: "#8CC8EE",
	// Sidebar part colours (wayfinding only)
	monitoringSolid: "#208DAA",
	monitoringText: "#196F86",
	monitoringHover: "#F1F8FB",
	monitoringSelected: "#DCEDF3",
	monitoringPressed: "#C8E2EB",
	alertingSolid: "#E09B26",
	alertingText: "#85590F",
	alertingHover: "#FDF7EC",
	alertingSelected: "#F9EBD3",
	alertingPressed: "#F3DCB5",
	reportingSolid: "#1D8A4C",
	reportingText: "#187340",
	reportingHover: "#EFF8F2",
	reportingSelected: "#DBEFE2",
	reportingPressed: "#C3E4CF",
};

export const colors = {
	gray200: "#EFEFEF",
	gray700: "#313131",
	gray900: "#151518",
	gray850: "#1c1c21",
	gray800: "#24242A",
	ink400: "#8C9893",
	inkDark900: "#ECEFED",
	inkDark600: "#B3BCB7",
	ruleDark: "#3A4642",
	ruleDarkStrong: "#4A5652",
	rowDividerDark: "#2A2F2D",
	successDark: "#4BC49E",
	errorDark: "#E8837A",
	warningDark: "#E0A458",
	infoDark: "#7FB8DE",
	brandGreen: "#13715B",
	brandGreenLight: "#4DAF94",
	green700: "#008300",
	yellow600: "#C98500",
	orange500: "#FFA500",
	orange700: "#D95926",
	blue500: "#2A78D6",
	aqua600: "#199E70",
	magenta400: "#D55181",
};

// 0 → 100 in steps of 10; read via getScoreColor(theme.palette.chart.score, value)
const scoreSpectrum = [
	"#DC2626",
	"#E65723",
	"#EE7B1D",
	"#F19416",
	"#EEA411",
	"#EAB308",
	"#C9B925",
	"#A4BD34",
	"#7EBA43",
	"#59B051",
	"#22A55A",
] as const;

export const getScoreColor = (spectrum: readonly string[], score: number): string => {
	const clamped = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
	return spectrum[Math.round((clamped / 100) * (spectrum.length - 1))];
};

// Equal lightness and chroma, avoiding the signal hues
const chartSeries = [
	"#6076BE",
	"#AE5B7E",
	"#90790F",
	"#008B91",
	"#B36043",
	"#8A67B1",
	"#6B8632",
	"#2A82B7",
	"#A0609B",
] as const;
export const SignalKeys = ["success", "error", "warning", "neutral", "info"] as const;
export type SignalKey = (typeof SignalKeys)[number];
export type SignalTone = { bg: string; text: string; border: string; mark: string };

// Non-status palette keys fall back to neutral
export const toSignalKey = (palette: string): SignalKey =>
	(SignalKeys as readonly string[]).includes(palette)
		? (palette as SignalKey)
		: "neutral";

// Sidebar wayfinding only (never status, charts or badges)
export const SidebarGroupKeys = ["monitoring", "alerting", "reporting"] as const;
export type SidebarGroupKey = (typeof SidebarGroupKeys)[number];
export type GroupTone = {
	solid: string;
	text: string;
	hover: string;
	selected: string;
	pressed: string;
};

const lightGroups: Record<SidebarGroupKey, GroupTone> = {
	monitoring: {
		solid: lightTokens.monitoringSolid,
		text: lightTokens.monitoringText,
		hover: lightTokens.monitoringHover,
		selected: lightTokens.monitoringSelected,
		pressed: lightTokens.monitoringPressed,
	},
	alerting: {
		solid: lightTokens.alertingSolid,
		text: lightTokens.alertingText,
		hover: lightTokens.alertingHover,
		selected: lightTokens.alertingSelected,
		pressed: lightTokens.alertingPressed,
	},
	reporting: {
		solid: lightTokens.reportingSolid,
		text: lightTokens.reportingText,
		hover: lightTokens.reportingHover,
		selected: lightTokens.reportingSelected,
		pressed: lightTokens.reportingPressed,
	},
};

const darkGroup = (solid: string): GroupTone => ({
	solid,
	text: solid,
	hover: alpha(solid, 0.08),
	selected: alpha(solid, 0.16),
	pressed: alpha(solid, 0.22),
});

const darkGroups: Record<SidebarGroupKey, GroupTone> = {
	monitoring: darkGroup(lightTokens.monitoringSolid),
	alerting: darkGroup(lightTokens.alertingSolid),
	reporting: darkGroup(lightTokens.reportingSolid),
};

export const lightPalette = {
	primary: {
		main: lightTokens.primary,
		dark: lightTokens.primaryHover,
		contrastText: lightTokens.white,
	},
	action: {
		rowHover: lightTokens.page,
		controlHover: lightTokens.raised,
		selected: lightTokens.green100,
		selectedHover: lightTokens.green100,
	},
	secondary: {
		main: colors.gray200,
	},
	background: {
		default: lightTokens.page,
		paper: lightTokens.white,
	},
	text: {
		primary: lightTokens.ink,
		secondary: lightTokens.text2,
		disabled: lightTokens.disabled,
	},
	divider: lightTokens.hairline,
	// main is the solid mark (dots, bars); dark is the text colour on a tint
	success: {
		main: lightTokens.successMark,
		dark: lightTokens.successText,
		contrastText: lightTokens.white,
	},
	error: {
		main: lightTokens.errorMark,
		dark: lightTokens.errorText,
		contrastText: lightTokens.white,
	},
	warning: {
		main: lightTokens.warningMark,
		dark: lightTokens.warningText,
		contrastText: lightTokens.white,
	},
	info: {
		main: lightTokens.infoText,
		contrastText: lightTokens.white,
	},
	neutral: {
		raised: lightTokens.raised,
		hairline: lightTokens.hairline,
		border: lightTokens.border,
		borderHover: lightTokens.grey500,
		rowDivider: lightTokens.rowDivider,
		icon: lightTokens.icon,
		tertiary: lightTokens.text3,
		subdued: lightTokens.subdued,
		hoverGreen: lightTokens.green50,
		selectedGreen: lightTokens.green100,
		tooltip: lightTokens.ink,
		sortedHeader: lightTokens.green50,
		sortedCell: lightTokens.sortedCell,
	},
	signal: {
		success: {
			bg: lightTokens.successBg,
			text: lightTokens.successText,
			border: lightTokens.successBorder,
			mark: lightTokens.successMark,
		},
		error: {
			bg: lightTokens.errorBg,
			text: lightTokens.errorText,
			border: lightTokens.errorBorder,
			mark: lightTokens.errorMark,
		},
		warning: {
			bg: lightTokens.warningBg,
			text: lightTokens.warningText,
			border: lightTokens.warningBorder,
			mark: lightTokens.warningMark,
		},
		neutral: {
			bg: lightTokens.neutralBg,
			text: lightTokens.neutralText,
			border: lightTokens.neutralBorder,
			mark: lightTokens.neutralMark,
		},
		info: {
			bg: lightTokens.infoBg,
			text: lightTokens.infoText,
			border: lightTokens.infoBorder,
			mark: lightTokens.infoMark,
		},
	} satisfies Record<SignalKey, SignalTone>,
	sidebar: {
		accent: lightTokens.primary,
		groups: lightGroups,
	},
	scrollbar: {
		alerting: "transparent",
		thumb: lightTokens.border,
	},
	rowStatus: {
		running: lightTokens.successBg,
		paused: lightTokens.warningBg,
	},
	chart: {
		phases: {
			dns: chartSeries[0],
			tcp: chartSeries[1],
			tls: chartSeries[2],
			request: chartSeries[3],
			firstByte: chartSeries[4],
			download: chartSeries[5],
		},
		series: chartSeries,
		score: scoreSpectrum,
	},
};

// Dark mode keeps its own colours; series and score colours are shared with light
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
		sortedHeader: alpha(colors.brandGreenLight, 0.1),
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
			bg: alpha(colors.infoDark, 0.14),
			text: colors.infoDark,
			border: alpha(colors.infoDark, 0.35),
			mark: colors.infoDark,
		},
	} satisfies Record<SignalKey, SignalTone>,
	sidebar: {
		accent: colors.brandGreenLight,
		groups: darkGroups,
	},
	scrollbar: {
		alerting: "transparent",
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
		series: chartSeries,
		score: scoreSpectrum,
	},
};
