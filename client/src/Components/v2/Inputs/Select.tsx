import Select from "@mui/material/Select";
import type { SelectProps } from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";

export const SelectInput: React.FC<SelectProps> = ({ ...props }) => {
	const theme = useTheme();
	return (
		<Select
			{...props}
			sx={{
				height: "34px",
				"& .MuiOutlinedInput-notchedOutline": {
					borderRadius: theme.shape.borderRadius,
					borderColor: theme.palette.primary.lowContrast,
				},
				"&:hover .MuiOutlinedInput-notchedOutline": {
					borderColor: theme.palette.primary.lowContrast,
				},
			}}
		/>
	);
};
