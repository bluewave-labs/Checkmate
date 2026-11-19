import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useTheme, darken } from "@mui/material/styles";
import { INPUT_BASE_HEIGHT, HOVER, LAYOUT } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

type ButtonInputProps = ButtonProps &
	Pick<React.AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">;

const PALETTE_COLORS = [
	"primary",
	"secondary",
	"error",
	"warning",
	"info",
	"success",
] as const;
type PaletteColor = (typeof PALETTE_COLORS)[number];

export const ButtonInput = ({ sx, ...props }: ButtonInputProps) => {
	const theme = useTheme();
	const colorKey = (props.color ?? "primary") as PaletteColor;
	const isSmall = props.size === "small";
	const isPrimaryContained = props.variant === "contained" && colorKey === "primary";

	const hoverOverrides: Record<string, unknown> = { boxShadow: "none" };

	if (props.variant === "outlined") {
		hoverOverrides.borderColor = theme.palette.neutral.borderHover;
		hoverOverrides.backgroundColor = theme.palette.neutral.raised;
	}

	if (props.variant === "contained") {
		const palette = theme.palette[colorKey];
		if (palette && typeof palette === "object" && "main" in palette) {
			hoverOverrides.backgroundColor = darken(palette.main, HOVER.DARKEN);
		}
	}

	if (isPrimaryContained) {
		hoverOverrides.backgroundColor = theme.palette.primary.dark;
	}

	const variantSx =
		props.variant === "outlined"
			? {
					color: theme.palette.text.secondary,
					borderColor: theme.palette.neutral.border,
				}
			: {};

	const disabledSx = isPrimaryContained
		? {
				"&.Mui-disabled": {
					backgroundColor: theme.palette.neutral.hairline,
				},
				"&.Mui-disabled:not(.MuiButton-loading)": {
					color: theme.palette.text.disabled,
				},
			}
		: {};

	const focusColor =
		theme.palette.mode === "dark"
			? theme.palette.primary.light
			: theme.palette.primary.main;

	return (
		<Button
			{...props}
			sx={{
				textTransform: "none",
				height: INPUT_BASE_HEIGHT,
				fontSize: isSmall ? typographyLevels.sm : typographyLevels.m,
				lineHeight: 1.2,
				fontWeight: 500,
				borderRadius: theme.shape.borderRadius,
				whiteSpace: "nowrap",
				textOverflow: "ellipsis",
				overflow: "hidden",
				boxShadow: "none",
				...(isSmall && { px: LAYOUT.SM }),
				"&:hover": hoverOverrides,
				"&.Mui-focusVisible": {
					outline: `2px solid ${focusColor}`,
					outlineOffset: 1,
				},
				...variantSx,
				...disabledSx,
				...sx,
			}}
		/>
	);
};
