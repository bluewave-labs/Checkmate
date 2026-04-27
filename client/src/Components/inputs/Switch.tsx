import { forwardRef } from "react";
import Switch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";

interface SwitchComponentProps extends SwitchProps {
	dualOption?: boolean;
}

export const SwitchComponent = forwardRef<HTMLInputElement, SwitchComponentProps>(
	function SwitchComponent({ sx, dualOption = false, ...props }, ref) {
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
					...(dualOption
						? [
								{
									"& .MuiSwitch-track": {
										backgroundColor: theme.palette.primary.main,
										opacity: 1,
									},
								},
							]
						: []),
					...additionalSx,
				]}
			/>
		);
	}
);
