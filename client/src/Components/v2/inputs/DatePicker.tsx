import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FieldLabel } from "./FieldLabel";
import { Calendar } from "lucide-react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";

interface DatePickerComponentProps extends Omit<DatePickerProps<Dayjs>, "label"> {
	fieldLabel?: string;
	required?: boolean;
	error?: boolean;
	helperText?: string;
}

export const DatePickerComponent = ({
	fieldLabel,
	required,
	error,
	helperText,
	...props
}: DatePickerComponentProps) => {
	const theme = useTheme();

	const picker = (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<DatePicker
				{...props}
				slots={{
					openPickerIcon: () => (
						<Calendar
							size={20}
							stroke={theme.palette.text.secondary}
						/>
					),
					...props.slots,
				}}
				slotProps={{
					switchViewButton: { sx: { display: "none" } },
					nextIconButton: { sx: { ml: theme.spacing(2) } },
					day: {
						sx: {
							"&.MuiPickersDay-root.Mui-disabled": {
								color: theme.palette.text.disabled,
							},
						},
					},
					field: {
						sx: {
							width: "fit-content",
							"& > .MuiOutlinedInput-root": {
								flexDirection: "row-reverse",
							},
							"& input": {
								minHeight: 34,
								p: 0,
								pl: theme.spacing(3),
								pr: theme.spacing(5),
							},
							"& fieldset": {
								borderColor: error ? theme.palette.error.main : theme.palette.divider,
								borderRadius: theme.shape.borderRadius,
							},
							"&:not(:has(.Mui-disabled)):not(:has(.Mui-error)) .MuiOutlinedInput-root:not(:has(input:focus)):hover fieldset":
								{
									borderColor: error ? theme.palette.error.main : theme.palette.divider,
								},
						},
					},
					inputAdornment: { sx: { ml: 0 } },
					openPickerButton: {
						sx: {
							py: 0,
							mr: 0,
						},
					},
					...props.slotProps,
				}}
			/>
		</LocalizationProvider>
	);

	return (
		<Stack spacing={theme.spacing(2)}>
			{fieldLabel && <FieldLabel required={required}>{fieldLabel}</FieldLabel>}
			{picker}
			{helperText && (
				<Typography
					variant="caption"
					color={error ? "error" : "text.secondary"}
				>
					{helperText}
				</Typography>
			)}
		</Stack>
	);
};
