import { forwardRef } from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material";
import { typographyLevels } from "@/theme/palette";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";

interface TextInputProps extends Omit<TextFieldProps, "label"> {
  fieldLabel?: string;
  required?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ fieldLabel, required, ...props }, ref) {
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
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.lowContrast,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.lowContrast,
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
  }
);
TextInput.displayName = "TextInput";
