import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme, darken } from "@mui/material/styles";
import { INPUT_BASE_HEIGHT, HOVER, FONT_WEIGHT, RADIUS } from "@/Utils/Theme/constants";

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
		hoverOverrides.borderColor = theme.palette.neutral.borderHover;
		hoverOverrides.backgroundColor = theme.palette.neutral.raised;
	}

	if (props.variant === "contained") {
		const colorKey = (props.color ?? "primary") as PaletteColor;
		const palette = theme.palette[colorKey];
		if (colorKey === "primary") {
			hoverOverrides.backgroundColor = theme.palette.primary.dark;
		} else if (palette && typeof palette === "object" && "main" in palette) {
			hoverOverrides.backgroundColor = darken(palette.main, HOVER.DARKEN);
		}
	}

	// Outlined is the secondary ("Cancel") button: grey border, secondary text
	const variantSx =
		props.variant === "outlined"
			? {
					color: theme.palette.text.secondary,
					borderColor: theme.palette.neutral.border,
				}
			: {};

	return (
		<Button
			{...props}
			sx={{
				textTransform: "none",
				height: INPUT_BASE_HEIGHT,
				lineHeight: 1.2,
				fontWeight: FONT_WEIGHT.MEDIUM,
				borderRadius: RADIUS.SM,
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
