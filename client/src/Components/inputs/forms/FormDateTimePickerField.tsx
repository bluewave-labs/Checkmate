import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import dayjs, { type Dayjs } from "dayjs";
import { DatePicker, TimePicker } from "@/Components/inputs";

export interface FormPickerFieldProps<T extends FieldValues> {
	name: FieldPath<T>;
	fieldLabel?: string;
	format?: string;
	onValueChange?: (value: string) => void; // e.g. () => trigger("startDate")
}

interface DayjsPickerProps {
	fieldLabel?: string;
	value: Dayjs | null;
	onChange: (value: Dayjs | null) => void;
	error?: boolean;
	helperText?: string;
}

interface FormDayjsPickerFieldProps<
	T extends FieldValues,
> extends FormPickerFieldProps<T> {
	picker: React.ComponentType<DayjsPickerProps>;
	format: string;
}

const FormDayjsPickerField = <T extends FieldValues>({
	name,
	fieldLabel,
	format,
	onValueChange,
	picker: Picker,
}: FormDayjsPickerFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Picker
					fieldLabel={fieldLabel}
					value={field.value ? dayjs(field.value, format) : null}
					onChange={(value) => {
						const next = value ? value.format(format) : "";
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

export const FormDatePickerField = <T extends FieldValues>({
	format = "YYYY-MM-DD",
	...rest
}: FormPickerFieldProps<T>) => (
	<FormDayjsPickerField
		{...rest}
		format={format}
		picker={DatePicker}
	/>
);

export const FormTimePickerField = <T extends FieldValues>({
	format = "HH:mm",
	...rest
}: FormPickerFieldProps<T>) => (
	<FormDayjsPickerField
		{...rest}
		format={format}
		picker={TimePicker}
	/>
);
