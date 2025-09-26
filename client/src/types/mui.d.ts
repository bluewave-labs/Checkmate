import "@mui/material/Button";

declare module "@mui/material/styles" {
	interface Palette {
		accent: Palette["primary"];
	}
	interface PaletteOptions {
		accent?: PaletteOptions["primary"];
	}

	interface PaletteColor {
		contrastTextSecondary?: string;
	}
}

declare module "@mui/material/Button" {
	interface ButtonPropsColorOverrides {
		accent: true;
	}
}
