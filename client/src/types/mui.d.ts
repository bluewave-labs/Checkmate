import "@mui/material/Button";

declare module "@mui/material/styles" {}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {}
}

declare module "@mui/material/CircularProgress" {
  interface CircularProgressPropsColorOverrides {}
}
