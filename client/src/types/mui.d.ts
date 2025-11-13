import "@mui/material/Button";

declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
    tertiary: Palette["primary"];
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
    tertiary?: PaletteOptions["primary"];
  }

  interface PaletteColor {
    contrastTextSecondary?: string;
    contrastTextTertiary?: string;
    lowContrast?: string;
    veryLowContrast?: string;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}
