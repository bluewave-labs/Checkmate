import "@mui/material/Button";

declare module "@mui/material/styles" {
  interface Palette {}
  interface PaletteOptions {}
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}

declare module "@mui/material/CircularProgress" {
  interface CircularProgressPropsColorOverrides {}
}
