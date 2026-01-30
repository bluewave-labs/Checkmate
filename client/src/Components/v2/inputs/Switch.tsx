import { forwardRef } from "react";
import Switch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";

export const SwitchComponent = forwardRef<HTMLInputElement, SwitchProps>(
	function SwitchComponent({ sx, ...props }, ref) {
		const theme = useTheme();
		const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

		return (
			<Switch
				{...props}
				slotProps={{
					input: {
						ref: ref,
					},
				}}
				sx={[
					{
						"& .MuiSwitch-switchBase": {
							"&.Mui-checked": {
								color: "#E0E0E0",
								"& + .MuiSwitch-track": {
									backgroundColor: theme.palette.primary.main,
									opacity: 1,
									border: 0,
								},
							},
						},
					},
					...additionalSx,
				]}
			/>
		);
	}
);
