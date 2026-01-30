import { forwardRef } from "react";
import Slider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";

export const SliderInput = forwardRef<HTMLSpanElement, SliderProps>(function SliderInput(
	{ sx, ...props },
	ref
) {
	const theme = useTheme();
	const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

	return (
		<Slider
			{...props}
			ref={ref}
			sx={[
				{
					"& .MuiSlider-track": {
						backgroundColor: theme.palette.primary.main,
						border: "none",
					},
					"& .MuiSlider-rail": {
						backgroundColor: theme.palette.grey[300],
						opacity: 1,
					},
					"& .MuiSlider-thumb": {
						backgroundColor: "#fff",
						"&:hover, &.Mui-focusVisible": {
							boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
						},
					},
					"& .MuiSlider-valueLabel": {
						backgroundColor: theme.palette.primary.main,
					},
				},
				...additionalSx,
			]}
		/>
	);
});

interface SliderWithLabelProps extends SliderProps {
	fieldLabel?: string;
	required?: boolean;
	showValue?: boolean;
	valueSuffix?: string;
}

export const SliderWithLabel = forwardRef<HTMLSpanElement, SliderWithLabelProps>(
	function SliderWithLabel(
		{ fieldLabel, required, showValue = true, valueSuffix = "", value, ...props },
		ref
	) {
		const theme = useTheme();

		const labelText = showValue && value !== undefined
			? `${fieldLabel}: ${value}${valueSuffix}`
			: fieldLabel;

		return (
			<Stack spacing={theme.spacing(2)}>
				{fieldLabel && <FieldLabel required={required}>{labelText}</FieldLabel>}
				<SliderInput {...props} value={value} ref={ref} />
			</Stack>
		);
	}
);
