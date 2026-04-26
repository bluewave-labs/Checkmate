const typographyBase = 13;

export const typographyLevels = {
	base: typographyBase,
	xs: `${(typographyBase - 4) / 16}rem`,
	s: `${(typographyBase - 2) / 16}rem`,
	m: `${typographyBase / 16}rem`,
	l: `${(typographyBase + 2) / 16}rem`,
	xl: `${(typographyBase + 10) / 16}rem`,
};

export const colors = {
	gray200: "#EFEFEF",
	gray700: "#313131",
	gray900: "#151518",
	gray850: "#1c1c21",
	brandGreen: "#13715B",
	brandGreenLight: "#4DAF94",
};

export const lightPalette = {
	primary: {
		main: colors.brandGreen,
	},
	secondary: {
		main: colors.gray200,
	},
	sidebar: {
		accent: colors.brandGreen,
	},
};

export const darkPalette = {
	primary: {
		main: colors.brandGreen,
	},
	secondary: {
		main: colors.gray700,
	},
	background: {
		default: colors.gray900,
		paper: colors.gray850,
	},
	sidebar: {
		accent: colors.brandGreenLight,
	},
};
