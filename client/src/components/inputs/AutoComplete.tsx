import Autocomplete from "@mui/material/Autocomplete";
import type { AutocompleteProps } from "@mui/material/Autocomplete";
import { TextInput, Checkbox } from "@/components/inputs";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import { FieldLabel } from "./FieldLabel";
import { ChevronDown } from "lucide-react";

type AutoCompleteInputProps = Omit<
  AutocompleteProps<any, boolean, boolean, boolean>,
  "renderInput"
> & {
  renderInput?: AutocompleteProps<
    any,
    boolean,
    boolean,
    boolean
  >["renderInput"];
  fieldLabel?: string;
  required?: boolean;
};

export const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  fieldLabel,
  required,
  renderInput,
  ...props
}) => {
  const theme = useTheme();
  const multiple = props.multiple;

  const defaultRenderInput = (params: any) => (
    <TextInput {...params} placeholder="Type to search" />
  );

  const autocomplete = (
    <Autocomplete
      {...props}
      disableCloseOnSelect={!!multiple}
      popupIcon={
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          style={{ marginRight: theme.spacing(3) }}
        />
      }
      renderInput={renderInput || defaultRenderInput}
      getOptionKey={(option) => option._id}
      renderTags={() => null}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <ListItem key={key} {...optionProps}>
            {multiple && <Checkbox checked={selected} />}
            {option.name}
          </ListItem>
        );
      }}
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
