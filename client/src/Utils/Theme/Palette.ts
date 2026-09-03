import { alpha } from "@mui/material/styles";
import { HOVER } from "@/Utils/Theme/constants";

const typographyBase = 13;

export const typographyLevels = {
	base: typographyBase, // 13px
	xs: `${(typographyBase - 4) / 16}rem`, // 9px
	s: `${(typographyBase - 2) / 16}rem`, // 11px
	m: `${typographyBase / 16}rem`, // 13px
	l: `${(typographyBase + 2) / 16}rem`, // 15px
	xl: `${(typographyBase + 5) / 16}rem`, // 18px
	xxl: `${(typographyBase + 10) / 16}rem`, // 23px
};

export const colors = {
	gray200: "#EFEFEF",
	gray700: "#313131",
	gray900: "#151518",
	gray850: "#1c1c21",
	ink900: "#101917",
	ink600: "#55635C",
	ink400: "#7C8983",
	surface50: "#F6F8F7",
	rule200: "#C7D2CC",
	successMain: "#0D6049",
	errorMain: "#A02B24",
	warningMain: "#8C5806",
	inkDark900: "#ECEFED",
	inkDark600: "#A3ADA8",
	ruleDark: "#3A4642",
	successDark: "#4BC49E",
	errorDark: "#E8837A",
	warningDark: "#E0A458",
	brandGreen: "#13715B",
	brandGreenLight: "#4DAF94",
	green200: "#ECF7F2",
	green700: "#008300",
	yellow200: "#FFF4E5",
	yellow500: "#EDA100",
	yellow600: "#C98500",
	orange500: "#FFA500",
	orange600: "#EB6834",
	orange700: "#D95926",
	blue400: "#3987E5",
	blue500: "#2A78D6",
	aqua500: "#1BAF7A",
	aqua600: "#199E70",
	magenta300: "#E87BA4",
	magenta400: "#D55181",
};

export const lightPalette = {
	primary: {
		main: colors.brandGreen,
	},
	action: {
		rowHover: alpha(colors.gray900, HOVER.ROW),
		controlHover: alpha(colors.gray900, HOVER.CONTROL),
		selected: alpha(colors.brandGreen, 0.06),
		selectedHover: alpha(colors.brandGreen, 0.1),
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
		secondary: colors.ink600,
		disabled: colors.ink400,
	},
	divider: colors.rule200,
	success: {
		main: colors.successMain,
	},
	error: {
		main: colors.errorMain,
	},
	warning: {
		main: colors.warningMain,
	},
	sidebar: {
		accent: colors.brandGreen,
	},
	rowStatus: {
		running: colors.green200,
		paused: colors.yellow200,
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
};

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
	sidebar: {
		accent: colors.brandGreenLight,
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
