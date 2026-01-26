import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ToggleButtonProps } from "@mui/material/ToggleButton";
import type { ToggleButtonGroupProps } from "@mui/material/ToggleButtonGroup";
import { useTheme } from "@mui/material/styles";

export const ToggleButtonInput = ({ sx, ...props }: ToggleButtonProps) => {
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
				"&:hover": {
					boxShadow: "none",
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
