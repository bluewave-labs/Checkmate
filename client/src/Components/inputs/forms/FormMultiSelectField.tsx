import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { useTheme } from "@mui/material/styles";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Autocomplete } from "@/Components/inputs";
import { LAYOUT } from "@/Utils/Theme/constants";

export interface MultiSelectOption {
	id: string | number;
	name: string;
}

interface FormMultiSelectFieldProps<T extends FieldValues, O extends MultiSelectOption> {
	name: FieldPath<T>;
	options: O[];
	fieldLabel?: string;
	renderRow?: (option: O) => React.ReactNode;
	renderOptionContent?: (option: O) => React.ReactNode;
}

export const FormMultiSelectField = <T extends FieldValues, O extends MultiSelectOption>({
	name,
	options,
	fieldLabel,
	renderRow,
	renderOptionContent,
}: FormMultiSelectFieldProps<T, O>) => {
	const { control } = useFormContext<T>();
	const theme = useTheme();
	const { t } = useTranslation();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => {
				const selected = options.filter((o) => (field.value ?? []).includes(o.id));
				return (
					<Stack spacing={theme.spacing(LAYOUT.MD)}>
						<Autocomplete
							multiple
							options={options}
							value={selected}
							getOptionLabel={(option) => option.name}
							isOptionEqualToValue={(option, value) => option.id === value.id}
							onChange={(_: unknown, newValue: O[]) => {
								field.onChange(newValue.map((o) => o.id));
							}}
							fieldLabel={fieldLabel}
							renderOptionContent={renderOptionContent}
							error={!!fieldState.error}
							helperText={fieldState.error?.message ?? ""}
						/>
						{selected.map((option, index) => (
							<Stack
								direction="row"
								alignItems="center"
								key={option.id}
								width="100%"
							>
								{renderRow ? (
									renderRow(option)
								) : (
									<Typography flexGrow={1}>{option.name}</Typography>
								)}
								<IconButton
									size="small"
									onClick={() => {
										field.onChange(
											(field.value ?? []).filter((id: O["id"]) => id !== option.id)
										);
									}}
									aria-label={t("common.buttons.remove")}
								>
									<Trash2 size={16} />
								</IconButton>
								{index < selected.length - 1 && <Divider />}
							</Stack>
						))}
					</Stack>
				);
			}}
		/>
	);
};
