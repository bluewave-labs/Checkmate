import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { ColorInput } from "@/Components/inputs";

interface FormColorFieldProps<T extends FieldValues> {
	name: FieldPath<T>;
	fieldLabel?: string;
}

export const FormColorField = <T extends FieldValues>({
	name,
	fieldLabel,
}: FormColorFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<ColorInput
					format="hex"
					value={field.value}
					onChange={field.onChange}
					fieldLabel={fieldLabel}
					error={!!fieldState.error}
					helperText={fieldState.error?.message ?? ""}
				/>
			)}
		/>
	);
};
