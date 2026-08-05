import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { Autocomplete } from "@/Components/inputs";

export interface AutocompleteOption {
	id: string;
	name: string;
}

interface FormAutocompleteProps<T extends FieldValues, O extends AutocompleteOption> {
	name: FieldPath<T>;
	options: O[];
	fieldLabel?: string;
	placeholder?: string;
}

export const FormAutocomplete = <T extends FieldValues, O extends AutocompleteOption>({
	name,
	options,
	fieldLabel,
	placeholder,
}: FormAutocompleteProps<T, O>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<Autocomplete
					options={options}
					getOptionLabel={(option) => option.name}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					value={options.find((o) => o.id === field.value) ?? null}
					onChange={(_: unknown, newValue: O | null) => {
						field.onChange(newValue?.id ?? "");
					}}
					fieldLabel={fieldLabel}
					placeholder={placeholder}
					error={!!fieldState.error}
					helperText={fieldState.error?.message ?? ""}
				/>
			)}
		/>
	);
};
