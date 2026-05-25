import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ToggleButtonProps } from "@mui/material/ToggleButton";
import type { ToggleButtonGroupProps } from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

export const ToggleButtonInput = ({ sx, ...props }: ToggleButtonProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const selectedBg = isDark
		? alpha(theme.palette.primary.main, 0.22)
		: alpha(theme.palette.primary.main, 0.06);
	const selectedHoverBg = isDark
		? alpha(theme.palette.primary.main, 0.3)
		: alpha(theme.palette.primary.main, 0.1);
	return (
		<ToggleButton
			{...props}
			sx={{
				px: 8,
				textTransform: "none",
				height: 34,
				fontWeight: 400,
				whiteSpace: "nowrap",
				textOverflow: "ellipsis",
				overflow: "hidden",
				boxShadow: "none",
				color: theme.palette.text.secondary,
				"&:hover": {
					boxShadow: "none",
					backgroundColor: theme.palette.action.hover,
				},
				"&.Mui-selected": {
					backgroundColor: selectedBg,
					color: theme.palette.text.primary,
					fontWeight: 500,
					"&:hover": {
						backgroundColor: selectedHoverBg,
					},
				},
				...sx,
			}}
		/>
	);
};

export const ToggleButtonGroupInput = ({ sx, ...props }: ToggleButtonGroupProps) => {
	const theme = useTheme();
	return (
		<ToggleButtonGroup
			{...props}
			sx={{
				"& .MuiToggleButtonGroup-grouped": {
					borderColor: theme.palette.divider,
					borderRadius: 0,
					"&:first-of-type": {
						borderTopLeftRadius: 2,
						borderBottomLeftRadius: 2,
					},
					"&:last-of-type": {
						borderTopRightRadius: 2,
						borderBottomRightRadius: 2,
					},
				},
				...sx,
			}}
		/>
	);
};
