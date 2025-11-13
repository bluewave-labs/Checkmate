import { lighten, darken } from "@mui/material/styles";

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
  offWhite: "#FEFEFE",
  offBlack: "#131315",
  gray0: "#FDFDFD",
  gray10: "#F4F4FF",
  gray50: "#F9F9F9",
  gray100: "#F3F3F3",
  gray200: "#EFEFEF",
  gray250: "#DADADA",
  gray500: "#A2A3A3",
  gray700: "#313131",
  gray900: "#1c1c1c",
  blueGray50: "#E8F0FE",
  blueGray400: "#8b9dc3",
  blueGray450: "#7C8BA1",
  blueGray500: "#475467",
  blueGray600: "#344054",
  blueGray800: "#1C2130",
  blueGray900: "#515151",
  blueBlueWave: "#1570EF",
  lightBlueWave: "#CDE2FF",
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

export const lightPalette = {
  accent: {
    main: colors.blueBlueWave,
    light: lighten(colors.blueBlueWave, 0.2),
    dark: darken(colors.blueBlueWave, 0.2),
    contrastText: colors.offWhite,
  },
  primary: {
    main: colors.offWhite,
    contrastText: colors.blueGray800,
    contrastTextSecondary: colors.blueGray600,
    contrastTextTertiary: colors.blueGray500,
    lowContrast: colors.gray250,
    veryLowContrast: lighten(colors.gray250, 0.5),
  },
  secondary: {
    main: colors.gray200,
    light: colors.lightBlueWave,
    dark: lighten(colors.gray200, 0.1),
    contrastText: colors.blueGray600,
  },
  tertiary: {
    main: colors.gray100,
    contrastText: colors.blueGray800,
  },
  success: {
    main: colors.green700,
    contrastText: colors.offWhite,
    lowContrast: colors.green400,
  },
  warning: {
    main: colors.orange700,
    contrastText: colors.offWhite,
    lowContrast: colors.orange100,
  },
  error: {
    main: colors.red700,
    contrastText: colors.offWhite,
    lowContrast: colors.red400,
  },
};

export const darkPalette = {
  accent: {
    main: colors.blueBlueWave,
    light: lighten(colors.blueBlueWave, 0.2),
    dark: darken(colors.blueBlueWave, 0.2),
    contrastText: colors.offWhite,
  },
  primary: {
    main: colors.offBlack,
    contrastText: colors.blueGray50,
    contrastTextSecondary: colors.gray200,
    contrastTextTertiary: colors.gray500,
    lowContrast: colors.blueGray600,
    veryLowContrast: darken(colors.blueGray600, 0.5),
  },
  secondary: {
    main: colors.gray700,
    light: colors.lightBlueWave,
    dark: lighten(colors.gray700, 0.1),
    contrastText: colors.gray200,
  },
  tertiary: {
    main: colors.blueGray800,
    contrastText: colors.gray100,
  },
  success: {
    main: colors.green100,
    contrastText: colors.offBlack,
    lowContrast: colors.green200,
  },
  warning: {
    main: colors.orange200,
    contrastText: colors.offBlack,
    lowContrast: colors.orange600,
  },
  error: {
    main: colors.red100,
    contrastText: colors.offBlack,
    lowContrast: colors.red600,
  },
};
