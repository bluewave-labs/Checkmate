import {
	Controller,
	useFormContext,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";
import { SliderWithLabel } from "@/Components/inputs";

interface FormSliderProps<T extends FieldValues> extends Omit<
	React.ComponentProps<typeof SliderWithLabel>,
	"name" | "value" | "onChange"
> {
	name: FieldPath<T>;
}

export const FormSliderField = <T extends FieldValues>({
	name,
	...rest
}: FormSliderProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<SliderWithLabel
					{...field}
					sliderMaxWidth={{ xs: "100%", md: "50%" }}
					{...rest}
				/>
			)}
		/>
	);
};
