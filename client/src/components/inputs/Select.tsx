import Select from "@mui/material/Select";
import React from "react";
import { useTheme } from "@mui/material/styles";
import type { SelectProps } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import { ChevronDown } from "lucide-react";
import Typography from "@mui/material/Typography";

interface SelectInputProps<T> extends Omit<SelectProps<T>, "label"> {
  fieldLabel?: string;
  required?: boolean;
  placeholder?: string;
  placeholderColor?: string;
}

export const SelectInput = <T,>({
  fieldLabel,
  required,
  placeholder,
  placeholderColor,
  ...props
}: SelectInputProps<T>) => {
  const theme = useTheme();
  const emptyPlaceholderColor = placeholderColor || theme.palette.text.disabled;

  const renderValue = (selected: any) => {
    const isMultiple = Boolean((props as any).multiple);
    const isEmpty = isMultiple
      ? !Array.isArray(selected) || selected.length === 0
      : selected === undefined || selected === null || selected === "";

    if (isEmpty && placeholder) {
      return (
        <Typography sx={{ color: emptyPlaceholderColor }}>
          {placeholder}
        </Typography>
      );
    }

    if (isMultiple) {
      const items: string[] = Array.isArray(selected) ? selected : [];
      const capitalized = items.map(
        (item) => item.charAt(0).toUpperCase() + item.slice(1)
      );
      return (<Typography>{capitalized.join(" | ")}</Typography>) as any;
    }

    const nodes = React.Children.toArray(props.children as React.ReactNode);
    for (const node of nodes) {
      if (!React.isValidElement(node)) continue;
      const el = node as React.ReactElement<{
        value?: unknown;
        children?: React.ReactNode;
      }>;
      if (el.props?.value === selected) {
        return (el.props.children ?? selected) as React.ReactNode;
      }
    }
    return selected as React.ReactNode;
  };

  const select = (
    <Select<T>
      {...props}
      displayEmpty
      renderValue={renderValue}
      inputProps={{
        ...(props.inputProps || {}),
        "aria-placeholder": placeholder,
      }}
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
