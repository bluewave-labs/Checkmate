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
