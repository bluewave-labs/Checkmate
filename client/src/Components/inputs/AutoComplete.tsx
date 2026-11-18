import Autocomplete from "@mui/material/Autocomplete";
import type { AutocompleteProps } from "@mui/material/Autocomplete";
import { TextField, Checkbox, MenuItem } from "@/Components/inputs";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { FieldLabel } from "./FieldLabel";
import { ChevronDown } from "lucide-react";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";
import { shadow } from "@/Utils/Theme/Theme";
import { useTranslation } from "react-i18next";

type AutoCompleteInputProps = Omit<
	AutocompleteProps<any, boolean, boolean, boolean>,
	"renderInput"
> & {
	renderInput?: AutocompleteProps<any, boolean, boolean, boolean>["renderInput"];
	fieldLabel?: string;
	required?: boolean;
	renderOptionContent?: (option: any) => React.ReactNode;
	placeholder?: string;
	error?: boolean;
	helperText?: string;
};

export const AutoCompleteInput = ({
	fieldLabel,
	required,
	renderInput,
	renderOptionContent,
	placeholder,
	error,
	helperText,
	...props
}: AutoCompleteInputProps) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const multiple = props.multiple;
	const { renderOption: customRenderOption, slotProps, ...autocompleteProps } = props;
	const defaultRenderInput = (params: any) => (
		<TextField
			{...params}
			placeholder={placeholder ?? t("common.form.autocomplete.placeholder")}
			error={error}
			helperText={helperText}
		/>
	);

	const autocomplete = (
		<Autocomplete
			{...autocompleteProps}
			disableCloseOnSelect={!!multiple}
			popupIcon={
				<ChevronDown
					size={18}
					strokeWidth={1.5}
					style={{ marginRight: theme.spacing(3) }}
				/>
			}
			renderInput={renderInput || defaultRenderInput}
			getOptionKey={(option) => option.id}
			renderTags={() => null}
			slotProps={{
				...slotProps,
				paper: { sx: { boxShadow: shadow } },
				listbox: {
					sx: {
						py: 0,
						"& .MuiAutocomplete-option": { py: SPACING.XL, px: LAYOUT.SM },
					},
				},
			}}
			renderOption={
				customRenderOption ||
				((props, option, { selected }) => {
					const { key, ...optionProps } = props;
					return (
						<MenuItem
							key={key}
							{...optionProps}
							sx={{ whiteSpace: "normal", "& .MuiCheckbox-root": { padding: 0 } }}
						>
							<Stack
								direction={"row"}
								alignItems={"center"}
								gap={theme.spacing(LAYOUT.XXS)}
								width="100%"
							>
								{multiple && <Checkbox checked={selected} />}
								{renderOptionContent ? renderOptionContent(option) : option.name}
							</Stack>
						</MenuItem>
					);
				})
			}
			sx={{
				"&.MuiAutocomplete-root .MuiAutocomplete-input": {
					padding: `0 ${theme.spacing(5)}`,
				},
				"& .MuiInputBase-root .MuiAutocomplete-endAdornment": {
					right: theme.spacing(3),
				},
			}}
		/>
	);

	if (fieldLabel) {
		return (
			<Stack spacing={theme.spacing(2)}>
				<FieldLabel required={required}>{fieldLabel}</FieldLabel>
				{autocomplete}
			</Stack>
		);
	}

	return autocomplete;
};
