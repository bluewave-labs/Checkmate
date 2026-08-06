import {
	Controller,
	useFormContext,
	type FieldValues,
	type FieldPath,
} from "react-hook-form";
import MenuItem from "@mui/material/MenuItem";
import { Select } from "@/Components/inputs";

export interface FormSelectOption {
	value: string | number;
	label: string;
}

interface FormSelectProps<T extends FieldValues> extends Omit<
	React.ComponentProps<typeof Select>,
	"name" | "error" | "value" | "onChange"
> {
	name: FieldPath<T>;
	options: FormSelectOption[];
	fallbackValue?: string | number; // display value while the field is undefined
	onValueChange?: (value: string | number) => void; // side effects, see Notes
}

export const FormSelectField = <T extends FieldValues>({
	name,
	options,
	fallbackValue,
	onValueChange,
	...rest
}: FormSelectProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Select
					{...field}
					value={field.value ?? fallbackValue ?? ""}
					onChange={(e) => {
						field.onChange(e.target.value);
						onValueChange?.(e.target.value as string | number);
					}}
					error={!!fieldState.error}
					{...rest}
				>
					{options.map((option) => (
						<MenuItem
							key={option.value}
							value={option.value}
						>
							{option.label}
						</MenuItem>
					))}
				</Select>
			)}
		/>
	);
};
