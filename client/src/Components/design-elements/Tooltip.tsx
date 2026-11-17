import MuiTooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { mergeSlotProps } from "@mui/material/utils";
import { Info } from "lucide-react";

import type { TooltipProps } from "@mui/material/Tooltip";

type StyledTooltipProps = TooltipProps;

export const Tooltip = ({
	placement = "top",
	slotProps,
	...props
}: StyledTooltipProps) => {
	const theme = useTheme();
	const backgroundColor =
		theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[800];

	return (
		<MuiTooltip
			{...props}
			placement={placement}
			slotProps={{
				...slotProps,
				tooltip: mergeSlotProps(slotProps?.tooltip, {
					sx: {
						backgroundColor,
						color: theme.palette.common.white,
						fontSize: "13px",
						padding: `${theme.spacing(4)} ${theme.spacing(5)}`,
						borderRadius: `${theme.shape.borderRadius}px`,
						boxShadow: theme.shadows[6],
					},
				}),
				arrow: mergeSlotProps(slotProps?.arrow, { sx: { color: backgroundColor } }),
			}}
		/>
	);
};

export interface TooltipWithInfoProps extends Omit<StyledTooltipProps, "children"> {
	iconSize?: number;
	iconColor?: string;
}

export const TooltipWithInfo = ({
	iconSize = 14,
	iconColor,
	...props
}: TooltipWithInfoProps) => {
	const theme = useTheme();

	const defaultColor = theme.palette.text.secondary;

	return (
		<Tooltip {...props}>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					cursor: "help",
				}}
			>
				<Info
					size={iconSize}
					strokeWidth={1.5}
					style={{
						opacity: 0.7,
						color: iconColor || defaultColor,
						transition: "opacity 0.2s ease",
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.opacity = "1";
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.opacity = "0.7";
					}}
				/>
			</span>
		</Tooltip>
	);
};
