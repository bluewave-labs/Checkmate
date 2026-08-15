import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Checkbox } from "@/Components/inputs";

interface FormCheckboxFieldProps<T extends FieldValues> {
	name: FieldPath<T>;
	label: string;
}

export const FormCheckboxField = <T extends FieldValues>({
	name,
	label,
}: FormCheckboxFieldProps<T>) => {
	const { control } = useFormContext<T>();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<FormControlLabel
					control={
						<Checkbox
							checked={field.value ?? false}
							onChange={(e) => field.onChange(e.target.checked)}
						/>
					}
					label={label}
				/>
			)}
		/>
	);
};
