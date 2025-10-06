import { useTheme } from "@mui/material/styles";
import ButtonGroup from "@mui/material/ButtonGroup";
import type { ButtonGroupProps } from "@mui/material/ButtonGroup";
export const ButtonGroupInput: React.FC<ButtonGroupProps> = ({
	orientation,
	...props
}) => {
	const theme = useTheme();

	return (
		<ButtonGroup
			orientation={orientation}
			{...props}
			sx={{
				...(orientation !== "vertical" && { height: 34 }),
				width: orientation === "vertical" ? "100%" : "auto",
				border: 1,
				borderStyle: "solid",
				borderColor: theme.palette.primary.lowContrast,
				borderRadius: 2,
				"& .MuiButtonGroup-grouped": {
					height: "100%",
				},
			}}
		/>
	);
};
