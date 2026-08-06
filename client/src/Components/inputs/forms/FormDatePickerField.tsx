import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import dayjs from "dayjs";
import { DatePicker } from "@/Components/inputs";

interface FormDatePickerFieldProps<T extends FieldValues> {
	name: FieldPath<T>;
	fieldLabel?: string;
	format?: string;
	onValueChange?: (value: string) => void; // e.g. () => trigger("startDate")
}

export const FormDatePickerField = <T extends FieldValues>({
	name,
	fieldLabel,
	format = "YYYY-MM-DD",
	onValueChange,
}: FormDatePickerFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<DatePicker
					fieldLabel={fieldLabel}
					value={field.value ? dayjs(field.value, format) : null}
					onChange={(date) => {
						const next = date ? date.format(format) : "";
						field.onChange(next);
						onValueChange?.(next);
					}}
					error={!!fieldState.error}
					helperText={fieldState.error?.message}
				/>
			)}
		/>
	);
};
