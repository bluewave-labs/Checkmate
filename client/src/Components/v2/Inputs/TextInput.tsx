import { forwardRef } from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material";

export const TextInput = forwardRef<HTMLInputElement, TextFieldProps>(
	function TextInput(props, ref) {
		return (
			<TextField
				{...props}
				inputRef={ref}
			/>
		);
	}
);
TextInput.displayName = "TextInput";
