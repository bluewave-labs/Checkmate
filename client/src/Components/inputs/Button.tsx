import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme, darken } from "@mui/material/styles";
import { HOVER } from "@/Utils/Theme/constants";

const PALETTE_COLORS = [
	"primary",
	"secondary",
	"error",
	"warning",
	"info",
	"success",
] as const;
type PaletteColor = (typeof PALETTE_COLORS)[number];

export const ButtonInput = ({ sx, ...props }: ButtonProps) => {
	const theme = useTheme();

	const hoverOverrides: Record<string, unknown> = { boxShadow: "none" };

	if (props.variant === "outlined") {
		hoverOverrides.borderColor = theme.palette.text.secondary;
	}

	if (props.variant === "contained") {
		const colorKey = (props.color ?? "primary") as PaletteColor;
		const palette = theme.palette[colorKey];
		if (palette && typeof palette === "object" && "main" in palette) {
			hoverOverrides.backgroundColor = darken(palette.main, HOVER.DARKEN);
		}
	}

	const variantSx =
		props.variant === "outlined"
			? {
					color: theme.palette.text.primary,
					borderColor: theme.palette.divider,
				}
			: {};

	return (
		<Button
			{...props}
			sx={{
				textTransform: "none",
				height: 34,
				fontWeight: 400,
				borderRadius: 2,
				whiteSpace: "nowrap",
				textOverflow: "ellipsis",
				overflow: "hidden",
				boxShadow: "none",
				"&:hover": hoverOverrides,
				...variantSx,
				...sx,
			}}
		/>
	);
};
