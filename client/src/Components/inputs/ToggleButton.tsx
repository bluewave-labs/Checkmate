import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ToggleButtonProps } from "@mui/material/ToggleButton";
import type { ToggleButtonGroupProps } from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import { typographyLevels } from "@/Utils/Theme/Palette";
import {
	FOCUS_RING,
	FONT_WEIGHT,
	GAP,
	INPUT_BASE_HEIGHT,
	MOTION,
	PADDING,
	RADIUS,
} from "@/Utils/Theme/constants";

// Option inside a segmented control (e.g. Recent / Day / Week / Month), styled
// after the public status page range switch: small uppercase label, no
// dividers, the selected option filled with a soft green block.
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
				border: 0,
				borderRadius: RADIUS.XS,
				backgroundColor: "transparent",
				textTransform: "uppercase",
				letterSpacing: theme.typography.eyebrow.letterSpacing,
				fontSize: typographyLevels.s,
				fontWeight: FONT_WEIGHT.SEMIBOLD,
				whiteSpace: "nowrap",
				boxShadow: "none",
				color: theme.palette.neutral.subdued,
				transition: `background-color ${MOTION.HOVER}, color ${MOTION.HOVER}`,
				"&:hover": {
					boxShadow: "none",
					backgroundColor: "transparent",
					color: theme.palette.text.primary,
				},
				"&.Mui-selected, &.Mui-selected:hover": {
					backgroundColor: theme.palette.neutral.selectedGreen,
					color: selectedText,
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

// Segmented control container: hairline border, white surface, a small inner
// padding so the selected option sits inside as a block. Input height so it
// lines up with other controls in a row.
export const ToggleButtonGroupInput = ({ sx, ...props }: ToggleButtonGroupProps) => {
	const theme = useTheme();
	return (
		<ToggleButtonGroup
			{...props}
			sx={{
				height: INPUT_BASE_HEIGHT,
				boxSizing: "border-box",
				padding: PADDING.SEGMENT_GROUP,
				gap: GAP.SEGMENT,
				backgroundColor: theme.palette.background.paper,
				border: `1px solid ${theme.palette.neutral.hairline}`,
				borderRadius: RADIUS.SM,
				"& .MuiToggleButtonGroup-grouped": {
					border: 0,
					margin: 0,
					// Override MUI's grouped corner and divider rules
					"&, &:not(:first-of-type), &:not(:last-of-type)": {
						borderRadius: RADIUS.XS,
						borderLeft: 0,
					},
				},
				...sx,
			}}
		/>
	);
};
