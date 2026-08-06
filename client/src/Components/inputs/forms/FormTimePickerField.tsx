import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import dayjs from "dayjs";
import { TimePicker } from "@/Components/inputs";

interface FormTimePickerFieldProps<T extends FieldValues> {
	name: FieldPath<T>;
	fieldLabel?: string;
	format?: string;
	onValueChange?: (value: string) => void; // e.g. () => trigger("startDate")
}

export const FormTimePickerField = <T extends FieldValues>({
	name,
	fieldLabel,
	format = "HH:mm",
	onValueChange,
}: FormTimePickerFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<TimePicker
					fieldLabel={fieldLabel}
					value={field.value ? dayjs(field.value, format) : null}
					onChange={(time) => {
						const next = time ? time.format(format) : "";
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
