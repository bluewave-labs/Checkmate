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
	}
}

declare module "@mui/material/Button" {
	interface ButtonPropsColorOverrides {
		accent: true;
	}
}

declare module "@mui/material/Button" {
	interface ButtonPropsVariantOverrides {
		group: true;
	}
}

declare module "@mui/material/ButtonGroup" {
	interface ButtonGroupPropsColorOverrides {
		accent: true;
	}

	interface ButtonGroupPropsVariantOverrides {
		group: true;
	}
}
