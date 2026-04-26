import { forwardRef } from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material";
import { typographyLevels } from "@/Utils/Theme/Palette";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";

interface TextInputProps extends Omit<TextFieldProps, "label"> {
	fieldLabel?: string;
	required?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
	{ fieldLabel, required, ...props },
	ref
) {
	const theme = useTheme();

	const input = (
		<TextField
			{...props}
			inputRef={ref}
			sx={{
				"& .MuiOutlinedInput-root": {
					borderRadius: theme.shape.borderRadius,
					height: 34,
					fontSize: typographyLevels.base,
					overflow: "hidden",
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
				"& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
					{
						WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.default} inset !important`,
						WebkitTextFillColor: `${theme.palette.text.primary} !important`,
						caretColor: theme.palette.text.primary,
						transition: "background-color 5000s ease-in-out 0s",
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
});
TextInput.displayName = "TextInput";
