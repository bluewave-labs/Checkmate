import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import type { MobileTimePickerProps } from "@mui/x-date-pickers/MobileTimePicker";
import type { Dayjs } from "dayjs";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";

interface TimePickerComponentProps extends Omit<MobileTimePickerProps<Dayjs>, "label"> {
	fieldLabel?: string;
	required?: boolean;
}

export const TimePickerComponent = ({
	fieldLabel,
	required,
	...props
}: TimePickerComponentProps) => {
	const theme = useTheme();

	const picker = (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<MobileTimePicker
				{...props}
				slotProps={{
					field: {
						sx: {
							width: "fit-content",
							"& input": {
								minHeight: 34,
								p: 0,
								px: theme.spacing(5),
							},
							"& fieldset": {
								borderColor: theme.palette.divider,
								borderRadius: theme.shape.borderRadius,
							},
							"&:not(:has(.Mui-disabled)):not(:has(.Mui-error)) .MuiOutlinedInput-root:not(:has(input:focus)):hover fieldset":
								{
									borderColor: theme.palette.divider,
								},
						},
					},
					...props.slotProps,
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
};
