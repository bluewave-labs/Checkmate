import { MuiColorInput } from "mui-color-input";
import type { MuiColorInputProps } from "mui-color-input";
import { typographyLevels } from "@/Utils/Theme/v2Palette";
import { useTheme } from "@mui/material";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "@/Components/v2/inputs/FieldLabel";

interface ColorPickerProps extends MuiColorInputProps {
	fieldLabel?: string;
	required?: boolean;
}

export const ColorInput = ({ fieldLabel, required, ...props }: ColorPickerProps) => {
	const theme = useTheme();
	const input = (
		<MuiColorInput
			{...props}
			sx={{
				"& .MuiOutlinedInput-root": {
					borderRadius: theme.shape.borderRadius,
					height: 34,
					fontSize: typographyLevels.base,
				},
				"& .MuiOutlinedInput-notchedOutline": {
					borderColor: theme.palette.divider,
				},
				"&:hover .MuiOutlinedInput-notchedOutline": {
					borderColor: theme.palette.divider,
				},
				"& .MuiFormHelperText-root": {
					marginLeft: 0,
					marginRight: 0,
					marginTop: theme.spacing(1),
				},
			}}
		/>
	);
	if (fieldLabel) {
		return (
			<Stack spacing={theme.spacing(2)}>
				<FieldLabel required={required}>{fieldLabel}</FieldLabel>
				{input}
			</Stack>
		);
	}

	return input;
};
