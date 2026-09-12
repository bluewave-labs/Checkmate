import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import type { MobileTimePickerProps } from "@mui/x-date-pickers/MobileTimePicker";
import type { Dayjs } from "dayjs";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FieldLabel } from "./FieldLabel";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { INPUT_BASE_HEIGHT } from "@/Utils/Theme/constants";

interface TimePickerComponentProps extends Omit<MobileTimePickerProps<Dayjs>, "label"> {
	fieldLabel?: string;
	required?: boolean;
	error?: boolean;
	helperText?: string;
}

export const TimePickerComponent = ({
	fieldLabel,
	required,
	error,
	helperText,
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
								minHeight: INPUT_BASE_HEIGHT,
								p: 0,
								px: theme.spacing(5),
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
