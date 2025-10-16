import { forwardRef } from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material";
import { typographyLevels } from "@/Utils/Theme/v2/palette";

export const TextInput = forwardRef<HTMLInputElement, TextFieldProps>(
	function TextInput(props, ref) {
		return (
			<TextField
				{...props}
				inputRef={ref}
				sx={{
					"& .MuiOutlinedInput-root": {
						height: 34,
						fontSize: typographyLevels.base,
					},
				}}
			/>
		);
	}
);
TextInput.displayName = "TextInput";
