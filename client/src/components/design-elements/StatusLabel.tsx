import Box from "@mui/material/Box";
import type { MonitorStatus } from "@/types/monitor";
import type { SxProps } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getStatusPalette, getValuePalette } from "@/utils/MonitorUtils";
import { useTheme } from "@mui/material/styles";

export const ValueTypes = ["positive", "negative", "neutral"] as const;
export type ValueType = (typeof ValueTypes)[number];

export const StatusLabel = ({
  status,
  sx,
}: {
  status: MonitorStatus;
  sx?: SxProps;
}) => {
  const theme = useTheme();
  const palette = getStatusPalette(status);
  const color = theme.palette[palette].main;
  const transformedText =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 1,
        bgcolor: alpha(color, 0.1),
        color: color,
        borderRadius: "4px",
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        ...sx,
      }}
    >
      {transformedText}
    </Box>
  );
};

export const ValueLabel = ({
  value,
  text,
}: {
  value: ValueType;
  text: string;
}) => {
  const theme = useTheme();
  const palette = getValuePalette(value);
  const color = theme.palette[palette].main;
  const transformedText =
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 1,
        bgcolor: alpha(color, 0.1),
        color: color,
        borderRadius: "4px",
        fontSize: 12,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {transformedText}
    </Box>
  );
};
