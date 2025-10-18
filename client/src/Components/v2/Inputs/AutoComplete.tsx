import Autocomplete from "@mui/material/Autocomplete";
import type { AutocompleteProps } from "@mui/material/Autocomplete";
import { TextInput } from "@/Components/v2/Inputs/TextInput";
import { CheckboxInput } from "@/Components/v2/Inputs/Checkbox";
import ListItem from "@mui/material/ListItem";
import { useTheme } from "@mui/material/styles";

type AutoCompleteInputProps = Omit<
	AutocompleteProps<any, boolean, boolean, boolean>,
	"renderInput"
> & {
	renderInput?: AutocompleteProps<any, boolean, boolean, boolean>["renderInput"];
};

export const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({ ...props }) => {
	const theme = useTheme();
	return (
		<Autocomplete
			{...props}
			disableCloseOnSelect
			renderInput={(params) => (
				<TextInput
					{...params}
					placeholder="Type to search"
				/>
			)}
			getOptionKey={(option) => option._id}
			renderTags={() => null}
			renderOption={(props, option, { selected }) => {
				const { key, ...optionProps } = props;
				return (
					<ListItem
						key={key}
						{...optionProps}
						sx={{
							color: theme.palette.text.primary,
						}}
					>
						<CheckboxInput checked={selected} />
						{option.name}
					</ListItem>
				);
			}}
			slotProps={{
				paper: {
					sx: {
						backgroundColor: theme.palette.background.paper,
						color: theme.palette.text.primary,
						"& .MuiAutocomplete-option": {
							color: theme.palette.text.primary,
						},
					},
				},
			}}
			sx={{
				"&.MuiAutocomplete-root .MuiAutocomplete-input": {
					padding: `0 ${theme.spacing(5)}`,
				},
			}}
		/>
	);
};
