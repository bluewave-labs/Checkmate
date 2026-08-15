import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { TextField } from "@/Components/inputs";

interface FormTextFieldProps<T extends FieldValues> extends Omit<
	React.ComponentProps<typeof TextField>,
	"name" | "error" | "helperText"
> {
	name: FieldPath<T>;
	helperText?: string;
}

export const FormTextField = <T extends FieldValues>({
	name,
	...rest
}: FormTextFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<TextField
					{...field}
					type="text"
					{...rest}
					value={field.value ?? ""}
					error={!!fieldState.error}
					helperText={fieldState.error?.message ?? rest.helperText ?? ""}
					fullWidth
				/>
			)}
		/>
	);
};
