import Typography from "@mui/material/Typography";
import { forwardRef } from "react";
import Slider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import { FieldLabel } from "./FieldLabel";
import Box from "@mui/material/Box";
import type { ResponsiveStyleValue } from "@mui/system";
import { LAYOUT } from "@/Utils/Theme/constants";

interface SliderInputProps extends SliderProps {
	sx?: SliderProps["sx"];
	showValue?: boolean;
	formatDisplayValue?: (value: number) => string;
}

export const SliderInput = forwardRef<HTMLSpanElement, SliderInputProps>(
	({ sx, showValue = false, formatDisplayValue, ...props }, ref) => {
		const theme = useTheme();
		const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

		const displayValue =
			showValue && formatDisplayValue && typeof props.value === "number"
				? formatDisplayValue(props.value)
				: props.value;

		return (
			<Stack
				gap={theme.spacing(LAYOUT.MD)}
				direction={"row"}
				alignItems={"center"}
			>
				{showValue && <Typography>{displayValue}</Typography>}
				<Slider
					{...props}
					ref={ref}
					sx={[
						{
							height: 4,
							padding: "13px 0",
							color: theme.palette.primary.main,
							"& .MuiSlider-rail": {
								height: 4,
								borderRadius: "999px",
								backgroundColor: theme.palette.grey[300],
								opacity: 1,
							},
							"& .MuiSlider-track": {
								height: 4,
								borderRadius: "999px",
								backgroundColor: theme.palette.primary.main,
								border: "none",
							},
							"& .MuiSlider-thumb": {
								width: 18,
								height: 18,
								backgroundColor: "#fff",
								border: `2px solid ${theme.palette.primary.main}`,
								boxShadow: "0 1px 2px rgba(16, 24, 40, 0.1)",
								"&.Mui-active": {
									boxShadow: `0 0 0 8px ${theme.palette.primary.main}29`,
								},
								"&:hover, &.Mui-focusVisible": {
									boxShadow: "none",
								},
								"&:active": {
									boxShadow: "none",
								},
								"&::before": { display: "none" },
							},
							"& .MuiSlider-mark": {
								width: 2,
								height: 2,
								borderRadius: "999px",
								backgroundColor: theme.palette.text.disabled,
								opacity: 0.5,
							},
							"& .MuiSlider-markActive": {
								backgroundColor: theme.palette.primary.main,
								opacity: 0.5,
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

SliderInput.displayName = "SliderInput";

interface SliderWithLabelProps extends SliderProps {
	fieldLabel?: string;
	required?: boolean;
	showValue?: boolean;
	formatDisplayValue?: (value: number) => string;
	sliderMaxWidth?: ResponsiveStyleValue<number | string>;
}

export const SliderWithLabel = forwardRef<HTMLSpanElement, SliderWithLabelProps>(
	(
		{
			fieldLabel,
			required,
			showValue = true,
			formatDisplayValue,
			value,
			sliderMaxWidth = "100%",
			...props
		},
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
						formatDisplayValue={formatDisplayValue}
						value={value}
						ref={ref}
					/>
				</Box>
			</Stack>
		);
	}
);

SliderWithLabel.displayName = "SliderWithLabel";
