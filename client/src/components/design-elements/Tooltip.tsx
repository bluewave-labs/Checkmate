import MuiTooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { Info } from "lucide-react";

import type { TooltipProps } from "@mui/material/Tooltip";

type StyledTooltipProps = TooltipProps;

export const Tooltip: React.FC<StyledTooltipProps> = ({
  placement = "top",
  ...props
}) => {
  const theme = useTheme();

  return (
    <MuiTooltip
      title={props.title}
      placement={placement}
      slotProps={{
        tooltip: {
          sx: {
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
                : "linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)",
            backgroundColor: "transparent",
            color: "#ffffff",
            fontSize: "13px",
            padding: `${theme.spacing(4)} ${theme.spacing(5)}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          },
        },
      }}
    >
      {props.children}
    </MuiTooltip>
  );
};

export interface TooltipWithInfoProps
  extends Omit<StyledTooltipProps, "children"> {
  iconSize?: number;
  iconColor?: string;
}

export const TooltipWithInfo: React.FC<TooltipWithInfoProps> = ({
  iconSize = 14,
  iconColor,
  ...props
}) => {
  const theme = useTheme();

  const defaultColor = theme.palette.primary.contrastTextTertiary;

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
