import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { SwitchComponent } from "@/Components/inputs";
import { SPACING } from "@/Utils/Theme/constants";

interface FormSwitchProps<T extends FieldValues> {
	name: FieldPath<T>;
	label: string;
	labelPlacement?: "start" | "end"; // left | right
}

export const FormSwitchField = <T extends FieldValues>({
	name,
	label,
	labelPlacement = "end",
}: FormSwitchProps<T>) => {
	const { control } = useFormContext<T>();
	const theme = useTheme();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<Stack
					direction="row"
					alignItems="center"
					spacing={labelPlacement === "start" ? undefined : theme.spacing(SPACING.LG)}
					justifyContent={labelPlacement === "start" ? "space-between" : undefined}
				>
					{labelPlacement === "start" ? (
						<>
							<Typography>{label}</Typography>
							<SwitchComponent
								checked={field.value ?? false}
								onChange={(e) => field.onChange(e.target.checked)}
							/>
						</>
					) : (
						<>
							<SwitchComponent
								checked={field.value ?? false}
								onChange={(e) => field.onChange(e.target.checked)}
							/>
							<Typography>{label}</Typography>
						</>
					)}
				</Stack>
			)}
		/>
	);
};
