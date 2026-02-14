import Typography from "@mui/material/Typography";
import { forwardRef } from "react";
import Slider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import Box from "@mui/material/Box";
import type { ResponsiveStyleValue } from "@mui/system";

interface SliderInputProps extends SliderProps {
	sx?: SliderProps["sx"];
	showValue?: boolean;
}

export const SliderInput = forwardRef<HTMLSpanElement, SliderInputProps>(
	({ sx, showValue = false, ...props }, ref) => {
		const theme = useTheme();
		const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

		return (
			<Stack
				gap={theme.spacing(8)}
				direction={"row"}
				alignItems={"center"}
			>
				{showValue && <Typography>{props.value}</Typography>}
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
								height: 15,
								width: 15,
								backgroundColor: "#fff",
								"&:hover, &.Mui-focusVisible": {
									boxShadow: "none",
								},
								"&:active": {
									boxShadow: "none",
								},
							},
							"& .MuiSlider-valueLabel": {
								backgroundColor: theme.palette.primary.main,
							},
						},
						...additionalSx,
					]}
				/>
			</Stack>
		);
	}
);

interface SliderWithLabelProps extends SliderProps {
	fieldLabel?: string;
	required?: boolean;
	showValue?: boolean;
	sliderMaxWidth?: ResponsiveStyleValue<number | string>;
}

export const SliderWithLabel = forwardRef<HTMLSpanElement, SliderWithLabelProps>(
	(
		{ fieldLabel, required, showValue = true, value, sliderMaxWidth = "100%", ...props },
		ref
	) => {
		const theme = useTheme();

		const labelText = fieldLabel;

		return (
			<Stack spacing={theme.spacing(2)}>
				{fieldLabel && <FieldLabel required={required}>{labelText}</FieldLabel>}
				<Box maxWidth={sliderMaxWidth}>
					<SliderInput
						{...props}
						showValue={showValue}
						value={value}
						ref={ref}
					/>
				</Box>
			</Stack>
		);
	}
);
