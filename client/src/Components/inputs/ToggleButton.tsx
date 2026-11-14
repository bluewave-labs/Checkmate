import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ToggleButtonProps } from "@mui/material/ToggleButton";
import type { ToggleButtonGroupProps } from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	FOCUS_RING,
	FONT_WEIGHT,
	INPUT_BASE_HEIGHT,
	MOTION,
	PADDING,
	RADIUS,
} from "@/Utils/Theme/constants";

// Segment inside a segmented control (e.g. Recent / Day / Week / Month).
// The selected segment uses the same light green fill as selected sidebar and
// menu items.
export const ToggleButtonInput = ({ sx, ...props }: ToggleButtonProps) => {
	const theme = useTheme();
	const selectedText =
		theme.palette.mode === "dark"
			? theme.palette.primary.light
			: theme.palette.primary.main;
	return (
		<ToggleButton
			{...props}
			sx={{
				height: "100%",
				padding: PADDING.SEGMENT,
				textTransform: "none",
				fontSize: typographyLevels.base,
				fontWeight: FONT_WEIGHT.REGULAR,
				whiteSpace: "nowrap",
				textOverflow: "ellipsis",
				overflow: "hidden",
				boxShadow: "none",
				color: theme.palette.text.secondary,
				transition: `background-color ${MOTION.HOVER}, color ${MOTION.HOVER}`,
				"&:hover": {
					boxShadow: "none",
					backgroundColor: theme.palette.neutral.raised,
					color: theme.palette.text.primary,
				},
				"&.Mui-selected, &.Mui-selected:hover": {
					backgroundColor: theme.palette.neutral.selectedGreen,
					color: selectedText,
					fontWeight: FONT_WEIGHT.MEDIUM,
				},
				"&.Mui-focusVisible": {
					outline: `${FOCUS_RING.WIDTH}px solid ${theme.palette.primary.main}`,
					outlineOffset: FOCUS_RING.INSET_OFFSET,
				},
				...sx,
			}}
		/>
	);
};

// Segmented control: one bordered container, hairline dividers between
// segments, input-height and input border so it lines up with other controls.
export const ToggleButtonGroupInput = ({ sx, ...props }: ToggleButtonGroupProps) => {
	const theme = useTheme();
	return (
		<ToggleButtonGroup
			{...props}
			sx={{
				height: INPUT_BASE_HEIGHT,
				boxSizing: "border-box",
				backgroundColor: theme.palette.background.paper,
				border: `1px solid ${theme.palette.neutral.border}`,
				borderRadius: RADIUS.SM,
				overflow: "hidden",
				"& .MuiToggleButtonGroup-grouped": {
					border: "none",
					borderRadius: 0,
					margin: 0,
					"&:not(:first-of-type)": {
						borderLeft: `1px solid ${theme.palette.neutral.hairline}`,
					},
				},
				...sx,
			}}
		/>
	);
};
