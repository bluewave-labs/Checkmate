import MuiTooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Info } from "lucide-react";

import type { TooltipProps } from "@mui/material/Tooltip";
import { RADIUS } from "@/Utils/Theme/constants";

type StyledTooltipProps = TooltipProps;

export const Tooltip = ({
	placement = "top",
	slotProps,
	...props
}: StyledTooltipProps) => {
	const theme = useTheme();

	return (
		<MuiTooltip
			title={props.title}
			placement={placement}
			slotProps={{
				tooltip: {
					sx: {
						backgroundColor: theme.palette.neutral.tooltip,
						color: theme.palette.common.white,
						fontSize: "13px",
						padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
						borderRadius: RADIUS.SM,
						boxShadow: "none",
					},
				},
				...slotProps,
			}}
		>
			{props.children}
		</MuiTooltip>
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
