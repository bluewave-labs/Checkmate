import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { TextField } from "@/Components/inputs";

interface FormNumberFieldProps<T extends FieldValues> extends Omit<
	React.ComponentProps<typeof TextField>,
	"name" | "error" | "helperText" | "type"
> {
	name: FieldPath<T>;
	emptyValue?: number; // what an empty input writes to the form; 0 keeps today's sentinel
}

export const FormNumberField = <T extends FieldValues>({
	name,
	emptyValue = 0,
	...rest
}: FormNumberFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<TextField
					{...field}
					type="number"
					value={
						field.value === undefined || field.value === emptyValue ? "" : field.value
					}
					onChange={(e) => {
						const val = e.target.value;
						field.onChange(val === "" ? emptyValue : Number(val));
					}}
					error={!!fieldState.error}
					helperText={fieldState.error?.message ?? ""}
					fullWidth
					{...rest}
				/>
			)}
		/>
	);
};
