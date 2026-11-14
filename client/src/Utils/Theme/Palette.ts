import { alpha } from "@mui/material/styles";
import { HOVER } from "@/Utils/Theme/constants";

const typographyBase = 13;

// Allowed sizes only: 11, 12, 13, 14, 16, 18, 24 px
export const typographyLevels = {
	base: typographyBase, // 13px
	xs: `${(typographyBase - 2) / 16}rem`, // 11px
	s: `${(typographyBase - 2) / 16}rem`, // 11px
	m: `${typographyBase / 16}rem`, // 13px
	l: `${(typographyBase + 1) / 16}rem`, // 14px
	xl: `${(typographyBase + 5) / 16}rem`, // 18px
	xxl: `${(typographyBase + 11) / 16}rem`, // 24px
};

// VerifyWise phase 1 tokens (light). Greys are slightly green-tinted.
export const vw = {
	ink: "#1A2E2B",
	text2: "#33453F",
	text3: "#495A56",
	grey500: "#5C6D69",
	icon: "#6B7C78",
	subdued: "#8A9894",
	disabled: "#A3AFAC",
	border: "#D1D5D5",
	hairline: "#E4E6E6",
	rowDivider: "#EFF1F0",
	raised: "#F3F6F5",
	page: "#FAFAFA",
	white: "#FFFFFF",
	primary: "#14715B",
	primaryHover: "#075443",
	green50: "#EFFAF6",
	green100: "#D9F2E9",
	// Signal colours: tint background, text on the tint, border, solid mark
	criticalBg: "#FDE2E2",
	criticalText: "#B91C1C",
	criticalBorder: "#F5B5B5",
	criticalMark: "#DC2626",
	highBg: "#FDEBD5",
	highText: "#9A4D05",
	highBorder: "#F8C98F",
	highMark: "#F28C18",
	lowBg: "#DCF2E4",
	lowText: "#17703B",
	lowBorder: "#A6DDB9",
	lowMark: "#22A55A",
	noneBg: "#EEF1F0",
	noneText: "#495A56",
	noneBorder: "#C9D1CF",
	noneMark: "#C9D1CF",
	infoBg: "#E3F2FC",
	infoText: "#2D6F99",
	infoBorder: "#BFE0F5",
	infoMark: "#8CC8EE",
};

export const colors = {
	gray200: "#EFEFEF",
	gray700: "#313131",
	gray900: "#151518",
	gray850: "#1c1c21",
	gray800: "#24242A",
	ink400: "#7C8983",
	inkDark900: "#ECEFED",
	inkDark600: "#A3ADA8",
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

// Score spectrum, 0 → 100 in steps of 10, for score bars such as uptime.
// Pick SCORE_SPECTRUM[Math.round(value / 10)].
export const SCORE_SPECTRUM = [
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

export const getScoreColor = (score: number): string => {
	const clamped = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
	return SCORE_SPECTRUM[Math.round(clamped / 10)];
};

// Chart series, fixed order. Equal lightness and chroma so no series looks
// heavier; they avoid the signal hues on purpose.
export const CHART_SERIES = [
	"#6076BE", // indigo
	"#AE5B7E", // rose
	"#90790F", // sand
	"#008B91", // teal
	"#B36043", // clay
	"#8A67B1", // violet
	"#6B8632", // moss
	"#2A82B7", // sky
	"#A0609B", // plum
] as const;
export const SignalKeys = ["success", "error", "warning", "neutral", "info"] as const;
export type SignalKey = (typeof SignalKeys)[number];
export type SignalTone = { bg: string; text: string; border: string; mark: string };

// Sidebar wayfinding only (never status, charts or badges)
export const SidebarParts = ["record", "track", "enforce"] as const;
export type SidebarPart = (typeof SidebarParts)[number];
export type PartTone = {
	solid: string;
	text: string;
	hover: string;
	selected: string;
	pressed: string;
};

const PART_SOLIDS: Record<SidebarPart, { solid: string; text: string }> = {
	record: { solid: "#208DAA", text: "#196F86" },
	track: { solid: "#E09B26", text: "#85590F" },
	enforce: { solid: "#1D8A4C", text: "#187340" },
};

const lightParts: Record<SidebarPart, PartTone> = {
	record: {
		...PART_SOLIDS.record,
		hover: "#F1F8FB",
		selected: "#DCEDF3",
		pressed: "#C8E2EB",
	},
	track: {
		...PART_SOLIDS.track,
		hover: "#FDF7EC",
		selected: "#F9EBD3",
		pressed: "#F3DCB5",
	},
	enforce: {
		...PART_SOLIDS.enforce,
		hover: "#EFF8F2",
		selected: "#DBEFE2",
		pressed: "#C3E4CF",
	},
};

const darkPart = (solid: string): PartTone => ({
	solid,
	text: solid,
	hover: alpha(solid, 0.08),
	selected: alpha(solid, 0.16),
	pressed: alpha(solid, 0.22),
});

const darkParts: Record<SidebarPart, PartTone> = {
	record: darkPart(PART_SOLIDS.record.solid),
	track: darkPart(PART_SOLIDS.track.solid),
	enforce: darkPart(PART_SOLIDS.enforce.solid),
};

export const lightPalette = {
	primary: {
		main: vw.primary,
		dark: vw.primaryHover,
		contrastText: vw.white,
	},
	action: {
		rowHover: vw.page,
		controlHover: vw.raised,
		selected: vw.green100,
		selectedHover: vw.green100,
	},
	secondary: {
		main: colors.gray200,
	},
	background: {
		default: vw.page,
		paper: vw.white,
	},
	text: {
		primary: vw.ink,
		secondary: vw.text2,
		disabled: vw.disabled,
	},
	divider: vw.hairline,
	// main is the solid mark (dots, bars); dark is the text colour on a tint
	success: {
		main: vw.lowMark,
		dark: vw.lowText,
		contrastText: vw.white,
	},
	error: {
		main: vw.criticalMark,
		dark: vw.criticalText,
		contrastText: vw.white,
	},
	warning: {
		main: vw.highMark,
		dark: vw.highText,
		contrastText: vw.white,
	},
	info: {
		main: vw.infoText,
		contrastText: vw.white,
	},
	neutral: {
		raised: vw.raised,
		hairline: vw.hairline,
		border: vw.border,
		borderHover: vw.grey500,
		rowDivider: vw.rowDivider,
		icon: vw.icon,
		tertiary: vw.text3,
		subdued: vw.subdued,
		hoverGreen: vw.green50,
		selectedGreen: vw.green100,
		tooltip: vw.ink,
	},
	signal: {
		success: { bg: vw.lowBg, text: vw.lowText, border: vw.lowBorder, mark: vw.lowMark },
		error: {
			bg: vw.criticalBg,
			text: vw.criticalText,
			border: vw.criticalBorder,
			mark: vw.criticalMark,
		},
		warning: {
			bg: vw.highBg,
			text: vw.highText,
			border: vw.highBorder,
			mark: vw.highMark,
		},
		neutral: {
			bg: vw.noneBg,
			text: vw.noneText,
			border: vw.noneBorder,
			mark: vw.noneMark,
		},
		info: { bg: vw.infoBg, text: vw.infoText, border: vw.infoBorder, mark: vw.infoMark },
	} satisfies Record<SignalKey, SignalTone>,
	sidebar: {
		accent: vw.primary,
		parts: lightParts,
	},
	scrollbar: {
		track: "transparent",
		thumb: vw.border,
	},
	rowStatus: {
		running: vw.lowBg,
		paused: vw.highBg,
	},
	chart: {
		// Multi-series chart: series colours in their fixed order
		phases: {
			dns: CHART_SERIES[0],
			tcp: CHART_SERIES[1],
			tls: CHART_SERIES[2],
			request: CHART_SERIES[3],
			firstByte: CHART_SERIES[4],
			download: CHART_SERIES[5],
		},
	},
};

// Dark mode is not part of the VerifyWise spec; it keeps the existing look and
// only gains the token groups the shared components now read.
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
		parts: darkParts,
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
};
