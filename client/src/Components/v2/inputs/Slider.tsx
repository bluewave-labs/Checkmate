import { forwardRef } from "react";
import Slider from "@mui/material/Slider";
import type { SliderProps } from "@mui/material/Slider";
import { useTheme } from "@mui/material/styles";

export const SliderInput = forwardRef<HTMLSpanElement, SliderProps>(
	function SliderInput({ sx, ...props }, ref) {
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
							border: `2px solid ${theme.palette.primary.main}`,
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
	}
);
