import { RadioGroup, useTheme } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { LAYOUT } from "@/Utils/Theme/constants";
import { RadioWithDescription } from "@/Components/inputs/Radio";
export interface FormRadioOption {
	value: string;
	label: string;
	description: string;
}

interface FormRadioGroupProps<T extends FieldValues> {
	name: FieldPath<T>;
	options: FormRadioOption[];
}
export const FormRadioGroup = <T extends FieldValues>({
	name,
	options,
}: FormRadioGroupProps<T>) => {
	const { control } = useFormContext<T>();
	const theme = useTheme();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState }) => (
				<FormControl error={!!fieldState.error}>
					<RadioGroup
						{...field}
						sx={{ gap: theme.spacing(LAYOUT.MD) }}
					>
						{options.map((option) => (
							<RadioWithDescription
								key={option.value}
								value={option.value}
								label={option.label}
								description={option.description}
							/>
						))}
					</RadioGroup>
				</FormControl>
			)}
		/>
	);
};
