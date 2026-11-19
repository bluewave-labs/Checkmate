import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ToggleButtonProps } from "@mui/material/ToggleButton";
import type { ToggleButtonGroupProps } from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import { INPUT_BASE_HEIGHT, LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { typographyLevels } from "@/Utils/Theme/Palette";

const SEGMENT_HEIGHT = 22;

export const ToggleButtonInput = ({ sx, ...props }: ToggleButtonProps) => {
	const theme = useTheme();
	return (
		<ToggleButton
			{...props}
			sx={{
				height: "100%",
				py: 0,
				px: LAYOUT.MD,
				border: 0,
				borderRadius: theme.shape.borderRadius,
				backgroundColor: "transparent",
				textTransform: "uppercase",
				letterSpacing: theme.typography.eyebrow.letterSpacing,
				fontSize: typographyLevels.s,
				fontWeight: 600,
				whiteSpace: "nowrap",
				boxShadow: "none",
				color: theme.palette.neutral.subdued,
				transition: "background-color 150ms ease, color 150ms ease",
				"&:hover": {
					boxShadow: "none",
					backgroundColor: "transparent",
					color: theme.palette.text.primary,
				},
				"&.Mui-selected, &.Mui-selected:hover": {
					backgroundColor: theme.palette.neutral.selectedGreen,
					color: theme.palette.accent,
				},
				"&.Mui-focusVisible": {
					outline: `2px solid ${theme.palette.primary.main}`,
					outlineOffset: -2,
				},
				...sx,
			}}
		/>
	);
};

export const ToggleButtonGroupInput = ({ sx, ...props }: ToggleButtonGroupProps) => {
	const theme = useTheme();
	const isVertical = props.orientation === "vertical";
	return (
		<ToggleButtonGroup
			{...props}
			sx={{
				height: isVertical ? "auto" : INPUT_BASE_HEIGHT,
				boxSizing: "border-box",
				p: SPACING.MD,
				gap: SPACING.SM,
				backgroundColor: theme.palette.background.paper,
				border: `1px solid ${theme.palette.neutral.hairline}`,
				borderRadius: theme.shape.borderRadius,
				"& .MuiToggleButtonGroup-grouped": {
					border: 0,
					m: 0,
					...(isVertical && { height: SEGMENT_HEIGHT }),
					"&.Mui-disabled": { border: 0 },
					"&, &:not(:first-of-type), &:not(:last-of-type)": {
						borderRadius: theme.shape.borderRadius,
						borderLeft: 0,
					},
				},
				...sx,
			}}
		/>
	);
};
