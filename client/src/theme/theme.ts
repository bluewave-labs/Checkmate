import { createTheme } from "@mui/material";
import { lightPalette, darkPalette, typographyLevels } from "./palette";

import type { Theme } from "@mui/material/styles";

export type PaletteKey = {
  [K in keyof Theme["palette"]]: Theme["palette"][K] extends { main: any }
    ? K
    : never;
}[keyof Theme["palette"]];

const fontFamilyPrimary = 'system-ui, sans-serif';
const shadow =
  "0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 3px 3px -3px rgba(16, 24, 40, 0.03)";

export const theme = (mode: string, palette: any) =>
  createTheme({
    breakpoints: {
      values: {
        xs: 300,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    spacing: 2,
    palette: {
      mode: mode,
      ...palette,
    },
    typography: {
      fontFamily: fontFamilyPrimary,
      fontSize: typographyLevels.base,
      h1: {
        fontSize: typographyLevels.xl,
        color: palette.primary.contrastText,
        fontWeight: 500,
      },
      h2: {
        fontSize: typographyLevels.l,
        color: palette.primary.contrastTextSecondary,
        fontWeight: 400,
      },

      body1: {
        fontSize: typographyLevels.m,
        color: palette.primary.contrastTextTertiary,
        fontWeight: 400,
      },
      body2: {
        fontSize: typographyLevels.s,
        color: palette.primary.contrastTextTertiary,
        fontWeight: 400,
      },
    },

    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            fontSize: typographyLevels.base,
            "&.Mui-focused": {
              color: theme.palette.secondary.contrastText,
            },
          }),
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            top: `-${theme.spacing(4)}`,
            "&.MuiInputLabel-shrink": {
              top: 0,
            },
          }),
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.accent.main,
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => {
            return {
              marginTop: 4,
              padding: 0,
              border: 1,
              borderStyle: "solid",
              borderColor: theme.palette.primary.lowContrast,
              borderRadius: 4,
              boxShadow: shadow,
              backgroundColor: theme.palette.primary.main,
              backgroundImage: "none",
            };
          },
        },
      },
    },
    shape: {
      borderRadius: 2,
    },
  });

export const lightTheme = createTheme(theme("light", lightPalette));
export const darkTheme = createTheme(theme("dark", darkPalette));
