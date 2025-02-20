import { lighten, darken } from "@mui/material/styles"; // CAIO_REVIEW

const typographyBase = 14;

/* TODO
Check for px in codebase. All font sizes should be in REM and should live here.
Rest should be checked on each case
*/
const typographyLevels = {
	base: typographyBase,
	xs: `${(typographyBase - 4) / 16}rem`,
	s: `${(typographyBase - 2) / 16}rem`,
	m: `${typographyBase / 16}rem`,
	l: `${(typographyBase + 2) / 16}rem`,
	xl: `${(typographyBase + 10) / 16}rem`,
};

/* TODO Review color palette and semantic colors */
const paletteColors = {
	white: "#FFFFFF",
	gray50: "#FEFEFE",
	gray60: "#FEFDFE",
	gray70: "#FDFDFD",
	gray80: "#FDFCFD",
	gray90: "#FCFCFD",
	gray100: "#F4F4F4",
	gray150: "#EFEFEF",
	gray200: "#E3E3E3",
	gray300: "#A2A3A3",
	gray500: "#838C99",
	gray600: "#454546",
	gray750: "#36363E",
	gray800: "#2D2D33",
	gray850: "#131315",
	gray860: "#111113",
	gray870: "#0F0F11",
	gray880: "#0C0C0E",
	gray890: "#09090B",
	blueGray20: "#E8F0FE",
	blueGray150: "#667085",
	blueGray200: "#475467",
	blueGray400: "#344054",
	blueGray900: "#1c2130",
	blueBlueWave: "#1570EF",
	blue700: "#4E5BA6",
	purple300: "#664EFF",
	purple400: "#3A1BFF",
	green50: "#D4F4E1",
	green150: "#45BB7A",
	green400: "#079455",
	green500: "#07B467",
	green800: "#1C4428",
	green900: "#12261E",
	red50: "#F9ECED",
	red100: "#FBD1D1",
	red200: "#F04438",
	red300: "#D32F2F",
	red700: "#542426",
	red800: "#912018",
	orange50: "#FEF8EA",
	orange100: "#FFECBC",
	orange300: "#FDB022",
	orange400: "#FF9F00",
	orange500: "#E88C30",
	orange600: "#DC6803",
	orange800: "#624711",
};

const semanticColors = {
	unresolved: {
		main: {
			light: paletteColors.blue700,
			dark: paletteColors.purple300,
		},
		light: {
			light: paletteColors.blueGray20,
			dark: paletteColors.purple400,
		},
		bg: {
			light: paletteColors.gray100,
			dark: paletteColors.gray100,
		},
	},
};

const newColors = {
	offWhite: "#FEFEFE",
	offBlack: "#131315",
	gray100: "#F3F3F3",
	gray200: "#EFEFEF",
	gray500: "#A2A3A3",
	blueGray50: "#E8F0FE",
	blueGray500: "#475467",
	blueGray600: "#344054",
	blueGray800: "#1C2130",
	blueBlueWave: "#1570EF",
	/* I changed green 100 and green 700. Need to change red and warning as well, and refactor the object following the structure */
	green100: "#67cd78",
	green200: "#4B9B77",
	green400: "#079455",
	green700: "#026513",
	orange100: "#FD8F22",
	orange200: "#D69A5D",
	orange600: "#9B734B",
	orange700: "#884605",
	red100: "#F27C7C",
	red400: "#D92020",
	red600: "#9B4B4B",
	red700: "#980303",
};

/* 
Structure:
main: background color
contrastText: color for main contrast text
contrastTextSecondary: if needed
contrastTextTertiary: if needed
lowContrast: if we need some low contrast for that color (for borders, and decorative elements). This should never be usend in text

*/
const newSemanticColors = {
	accent: {
		main: {
			light: newColors.blueBlueWave,
			dark: newColors.blueBlueWave,
		},
		light: {
			light: lighten(newColors.blueBlueWave, 0.2), //CAIO_REVIEW
			dark: lighten(newColors.blueBlueWave, 0.2), //CAIO_REVIEW
		},
		darker: {
			// CAIO_REVIEW
			light: darken(newColors.blueBlueWave, 0.2), // CAIO_REVIEW
			dark: darken(newColors.blueBlueWave, 0.2), // CAIO_REVIEW
		},

		contrastText: {
			light: newColors.offWhite,
			dark: newColors.offWhite,
		},
	},
	primary: {
		main: {
			light: newColors.offWhite,
			dark: newColors.offBlack,
		},
		contrastText: {
			light: newColors.blueGray800,
			dark: newColors.blueGray50,
		},
		contrastTextSecondary: {
			light: newColors.blueGray600,
			dark: newColors.gray200,
		},
		// CAIO_REVIEW, need a brighter color for dark bg
		contrastTextSecondaryDarkBg: {
			light: newColors.gray200,
			dark: newColors.gray200,
		},
		contrastTextTertiary: {
			light: newColors.blueGray500,
			dark: newColors.gray500,
		},
		lowContrast: {
			light: newColors.gray200,
			dark: newColors.blueGray600,
		},
	},
	secondary: {
		main: {
			light: newColors.gray200,
			dark: "#313131" /* newColors.blueGray600 */,
		},
		contrastText: {
			light: newColors.blueGray600,
			dark: newColors.gray200,
		},
	},
	tertiary: {
		main: {
			light: newColors.gray100,
			dark: newColors.blueGray800,
		},
		contrastText: {
			light: newColors.blueGray800,
			dark: newColors.gray100,
		},
	},
	success: {
		main: {
			light: newColors.green700,
			dark: newColors.green100,
		},
		contrastText: {
			light: newColors.offWhite,
			dark: newColors.offBlack,
		},
		lowContrast: {
			light: newColors.green400,
			dark: newColors.green200,
		},
	},
	warning: {
		main: {
			light: newColors.orange700,
			dark: newColors.orange200,
		},
		contrastText: {
			light: newColors.offWhite,
			dark: newColors.offBlack,
		},
		lowContrast: {
			light: newColors.orange100,
			dark: newColors.orange600,
		},
	},
	error: {
		main: {
			light: newColors.red700,
			dark: newColors.red100,
		},
		contrastText: {
			light: newColors.offWhite,
			dark: newColors.offBlack,
		},
		lowContrast: {
			light: newColors.red400,
			dark: newColors.red600,
		},
	},
	/* These are temporary, just for everything not to break */
	gradient: {
		color1: {
			light: paletteColors.gray90,
			dark: paletteColors.gray890,
		},
		color2: {
			light: paletteColors.gray80,
			dark: paletteColors.gray880,
		},
		color3: {
			light: paletteColors.gray70,
			dark: paletteColors.gray870,
		},
		color4: {
			light: paletteColors.gray60,
			dark: paletteColors.gray860,
		},
		color5: {
			light: paletteColors.gray50,
			dark: paletteColors.gray850,
		},
	},

	map: {
		main: {
			light: newColors.offWhite,
			dark: undefined,
		},
		lowContrast: {
			light: newColors.gray200,
			dark: undefined,
		},
		highContrast: {
			light: newColors.gray500,
			dark: undefined,
		},
	},

	distributedStatusHeader: {
		up: {
			light: "#073C2D",
			dark: "#073C2D",
		},
		down: {
			light: newColors.red700,
			dark: newColors.red700,
		},
		primaryText: {
			light: "#34D399",
			dark: "#34D399",
		},
		primaryTextBackground: {
			light: "#094434",
			dark: "#094434",
		},
		secondaryText: {
			light: "#22946C",
			dark: "#22946C",
		},
	},
};

export { typographyLevels, semanticColors as colors, newSemanticColors };
