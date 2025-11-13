import { DateTimePicker as MuiDateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { forwardRef } from "react";
import { useTheme } from "@mui/material/styles";
import type { DateTimePickerProps } from "@mui/x-date-pickers/DateTimePicker";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import { Calendar } from "lucide-react";

interface CustomDateTimePickerProps extends Omit<DateTimePickerProps<any>, "label"> {
  fieldLabel?: string;
  required?: boolean;
}

export const DateTimePicker = forwardRef<HTMLDivElement, CustomDateTimePickerProps>(
  function DateTimePicker({ fieldLabel, required, ...props }, ref) {
    const theme = useTheme();

    const picker = (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDateTimePicker
          {...props}
          ref={ref as any}
          slots={{
            openPickerIcon: () => <Calendar size={18} strokeWidth={1.5} />,
          }}
          sx={{
            "& .MuiPickersOutlinedInput-root ": {
              height: 34,
              borderRadius: theme.shape.borderRadius,
              borderColor: theme.palette.primary.lowContrast,
            },
            "& .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.lowContrast,
            },
            "&:hover .MuiPickersOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.lowContrast,
            },
            "& .MuiPickersInputBase-root.MuiPickersOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline":
              {
                borderColor: theme.palette.accent.main,
              },
            "& .MuiFormHelperText-root": {
              marginLeft: 0,
              marginRight: 0,
              marginTop: theme.spacing(1),
            },
          }}
        />
      </LocalizationProvider>
    );

    if (fieldLabel) {
      return (
        <Stack spacing={theme.spacing(2)}>
          <FieldLabel required={required}>{fieldLabel}</FieldLabel>
          {picker}
        </Stack>
      );
    }

    return picker;
  }
);

(DateTimePicker as any).displayName = "DateTimePicker";
