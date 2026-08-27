import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { Autocomplete } from "@/Components/inputs";
import type { AutocompleteProps } from "@mui/material/Autocomplete";

export interface AutocompleteOption {
	id: string | number;
	name: string;
}

interface FormAutocompleteProps<T extends FieldValues, O extends AutocompleteOption> {
	name: FieldPath<T>;
	options: O[];
	fieldLabel?: string;
	placeholder?: string;
	filterOptions?: AutocompleteProps<O, false, false, false>["filterOptions"];
	getOptionDisabled?: AutocompleteProps<O, false, false, false>["getOptionDisabled"];
	disableClearable?: boolean;
}

export const FormAutocompleteField = <
	T extends FieldValues,
	O extends AutocompleteOption,
>({
	name,
	options,
	fieldLabel,
	placeholder,
	filterOptions,
	getOptionDisabled,
	disableClearable,
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
						if (newValue === null && disableClearable) return;
						field.onChange(newValue?.id ?? "");
					}}
					fieldLabel={fieldLabel}
					placeholder={placeholder}
					filterOptions={filterOptions}
					getOptionDisabled={getOptionDisabled}
					disableClearable={disableClearable}
					error={!!fieldState.error}
					helperText={fieldState.error?.message ?? ""}
				/>
			)}
		/>
	);
};
