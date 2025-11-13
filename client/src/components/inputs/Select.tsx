import Select from "@mui/material/Select";
import { useTheme } from "@mui/material/styles";
import type { SelectProps } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import { ChevronDown } from "lucide-react";

interface SelectInputProps<T> extends Omit<SelectProps<T>, "label"> {
  fieldLabel?: string;
  required?: boolean;
}

export const SelectInput = <T,>({ fieldLabel, required, ...props }: SelectInputProps<T>) => {
  const theme = useTheme();

  const select = (
    <Select<T>
      {...props}
      IconComponent={() => (
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          style={{ marginRight: theme.spacing(3) }}
        />
      )}
      sx={{
        height: "34px",
        "& .MuiSelect-icon": {
          right: theme.spacing(3),
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderRadius: theme.shape.borderRadius,
          borderColor: theme.palette.primary.lowContrast,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: theme.palette.primary.lowContrast,
        },
        ...props.sx,
      }}
    />
  );

  if (fieldLabel) {
    return (
      <Stack spacing={theme.spacing(2)}>
        <FieldLabel required={required}>{fieldLabel}</FieldLabel>
        {select}
      </Stack>
    );
  }

  return select;
};
