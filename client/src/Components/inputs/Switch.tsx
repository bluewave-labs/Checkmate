import { forwardRef } from "react";
import Switch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import { LAYOUT, SPACING } from "@/Utils/Theme/constants";

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
					{
						width: 36,
						height: 20,
						padding: `0 ${theme.spacing(SPACING.XXL)} 0 0`,
						boxSizing: "content-box",
						overflow: "visible",
						"& .MuiSwitch-switchBase": {
							padding:
								props.size === "small"
									? theme.spacing(LAYOUT.XXS)
									: theme.spacing(SPACING.SM),
							"&.Mui-checked": {
								transform: "translateX(16px)",
								color: "#fff",
								"& + .MuiSwitch-track": {
									backgroundColor: theme.palette.primary.main,
									opacity: 1,
									border: "0",
								},
							},
						},
						"& .MuiSwitch-thumb": {
							width: 16,
							height: 16,
							boxShadow: "0 1px 2px rgba(16, 24, 40, 0.1)",
						},
						"& .MuiSwitch-track": {
							borderRadius: "999px",
							backgroundColor:
								theme.palette.mode === "dark"
									? "rgba(255,255,255,0.16)"
									: theme.palette.action.disabledBackground,
							opacity: 1,
						},
					},
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
