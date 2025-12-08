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
  blueBlueWave: "#1570EF",
};

export const lightPalette = {
  primary: {
    main: colors.blueBlueWave,
  },
  secondary: {
    main: colors.gray200,
  },
};

export const darkPalette = {
  primary: {
    main: colors.blueBlueWave,
  },
  secondary: {
    main: colors.gray700,
  },
};
